import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ethers } from "https://esm.sh/ethers@6.13.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// CAMLY Token contract address on BSC
const CAMLY_TOKEN_ADDRESS = "0xF9ffF1976FADeF8712319Fa46881Db0e0Fb2F828";

// ERC20 Transfer ABI
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)"
];

// BSC RPC endpoints
const BSC_RPC_URLS = [
  "https://bsc-dataseed1.binance.org",
  "https://bsc-dataseed2.binance.org",
  "https://bsc-dataseed3.binance.org",
  "https://bsc-dataseed4.binance.org"
];

interface ClaimRequest {
  wallet_address: string;
  amount: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { wallet_address, amount }: ClaimRequest = await req.json();
    console.log(`📥 Claim request: ${amount} CAMLY to ${wallet_address}`);

    if (!wallet_address || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid request: wallet_address and amount required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!ethers.isAddress(wallet_address)) {
      return new Response(
        JSON.stringify({ error: "Invalid wallet address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("wallet_address, wallet_balance")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify wallet matches
    if (profile.wallet_address?.toLowerCase() !== wallet_address.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Wallet address mismatch" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check balance
    const currentBalance = profile.wallet_balance || 0;
    if (currentBalance < amount) {
      return new Response(
        JSON.stringify({ 
          error: "Insufficient balance",
          current_balance: currentBalance,
          requested: amount
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get reward wallet private key
    const rewardPrivateKey = Deno.env.get("REWARDS_SIGNER_PRIVATE_KEY");
    if (!rewardPrivateKey) {
      console.error("REWARDS_SIGNER_PRIVATE_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Connect to BSC
    let provider: ethers.JsonRpcProvider | null = null;
    for (const rpcUrl of BSC_RPC_URLS) {
      try {
        provider = new ethers.JsonRpcProvider(rpcUrl);
        await provider.getBlockNumber();
        console.log(`✅ Connected to BSC: ${rpcUrl}`);
        break;
      } catch (e) {
        console.log(`❌ Failed to connect to ${rpcUrl}`);
      }
    }

    if (!provider) {
      return new Response(
        JSON.stringify({ error: "Failed to connect to BSC network" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create wallet and contract instance
    const wallet = new ethers.Wallet(rewardPrivateKey, provider);
    const camlyToken = new ethers.Contract(CAMLY_TOKEN_ADDRESS, ERC20_ABI, wallet);

    console.log(`💰 Reward wallet: ${wallet.address}`);

    // Check reward wallet CAMLY balance
    const rewardBalance = await camlyToken.balanceOf(wallet.address);
    const amountWei = ethers.parseEther(amount.toString());
    
    console.log(`📊 Reward wallet balance: ${ethers.formatEther(rewardBalance)} CAMLY`);
    console.log(`📤 Amount to send: ${amount} CAMLY (${amountWei} wei)`);

    if (rewardBalance < amountWei) {
      console.error("Insufficient CAMLY in reward wallet");
      return new Response(
        JSON.stringify({ 
          error: "Reward pool insufficient",
          pool_balance: ethers.formatEther(rewardBalance),
          requested: amount
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send CAMLY tokens
    console.log(`🚀 Sending ${amount} CAMLY to ${wallet_address}...`);
    
    const tx = await camlyToken.transfer(wallet_address, amountWei, {
      gasLimit: 100000,
    });

    console.log(`📝 Transaction hash: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait(1);
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

    // Deduct balance from profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        wallet_balance: currentBalance - amount,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Failed to update balance:", updateError);
      // Transaction already sent, log the issue but don't fail
    }

    // Record transaction
    await supabase.from("camly_coin_transactions").insert({
      user_id: user.id,
      amount: -amount,
      transaction_type: "withdrawal_completed",
      description: `Claimed ${amount} CAMLY to ${wallet_address.slice(0, 6)}...${wallet_address.slice(-4)} | TX: ${tx.hash}`,
    });

    console.log(`🎉 Claim successful! ${amount} CAMLY sent to ${wallet_address}`);

    return new Response(
      JSON.stringify({
        success: true,
        tx_hash: tx.hash,
        amount: amount,
        to_address: wallet_address,
        block_number: receipt.blockNumber,
        bscscan_url: `https://bscscan.com/tx/${tx.hash}`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: unknown) {
    console.error("Error in claim-camly-direct:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
