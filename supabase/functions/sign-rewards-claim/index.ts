import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ethers } from "https://esm.sh/ethers@6.13.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignRequest {
  wallet_address: string;
  amount: number; // Amount in CAMLY (not wei)
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { wallet_address, amount }: SignRequest = await req.json();

    if (!wallet_address || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid request: wallet_address and amount required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate wallet address
    if (!ethers.isAddress(wallet_address)) {
      return new Response(
        JSON.stringify({ error: "Invalid wallet address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check user's wallet matches
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

    // Verify wallet address matches profile
    if (profile.wallet_address?.toLowerCase() !== wallet_address.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Wallet address mismatch" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check sufficient balance
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

    // Get signer private key
    const signerPrivateKey = Deno.env.get("REWARDS_SIGNER_PRIVATE_KEY");
    if (!signerPrivateKey) {
      console.error("REWARDS_SIGNER_PRIVATE_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get contract address
    const rewardsContractAddress = Deno.env.get("REWARDS_CLAIM_CONTRACT_ADDRESS");
    if (!rewardsContractAddress) {
      console.error("REWARDS_CLAIM_CONTRACT_ADDRESS not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert amount to wei (18 decimals)
    const amountWei = ethers.parseEther(amount.toString());

    // Generate unique nonce
    const nonce = ethers.keccak256(
      ethers.toUtf8Bytes(`${user.id}-${wallet_address}-${amount}-${Date.now()}-${Math.random()}`)
    );

    // BSC Mainnet chain ID
    const chainId = 56;

    // Create message hash (must match contract)
    const messageHash = ethers.keccak256(
      ethers.solidityPacked(
        ["address", "uint256", "bytes32", "uint256", "address"],
        [wallet_address, amountWei, nonce, chainId, rewardsContractAddress]
      )
    );

    // Sign the message
    const signer = new ethers.Wallet(signerPrivateKey);
    const signature = await signer.signMessage(ethers.getBytes(messageHash));

    // Deduct balance from profile (optimistic - will be confirmed by blockchain)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        wallet_balance: currentBalance - amount,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Failed to update balance:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update balance" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record pending transaction
    await supabase.from("camly_coin_transactions").insert({
      user_id: user.id,
      amount: -amount,
      transaction_type: "withdrawal_pending",
      description: `Pending withdrawal to ${wallet_address.slice(0, 6)}...${wallet_address.slice(-4)}`,
    });

    console.log(`Signed withdrawal for ${wallet_address}: ${amount} CAMLY`);

    return new Response(
      JSON.stringify({
        success: true,
        signature,
        nonce,
        amount_wei: amountWei.toString(),
        contract_address: rewardsContractAddress,
        chain_id: chainId,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in sign-rewards-claim:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
