import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ethers } from "https://esm.sh/ethers@6.9.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CAMLY_CONTRACT_ADDRESS = '0x0910320181889feFDE0BB1Ca63962b0A8882e413';
const BSC_RPC_URL = 'https://bsc-dataseed1.binance.org';

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token and verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('has_role', { role_name: 'admin' });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get reward wallet address from secrets
    const rewardWalletAddress = Deno.env.get('CAMLY_REWARD_WALLET_ADDRESS');
    if (!rewardWalletAddress) {
      return new Response(
        JSON.stringify({ success: false, error: 'Reward wallet address not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Connect to BSC
    const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
    
    // Get BNB balance
    const bnbBalanceWei = await provider.getBalance(rewardWalletAddress);
    const bnbBalance = parseFloat(ethers.formatEther(bnbBalanceWei));

    // Get CAMLY balance
    const camlyContract = new ethers.Contract(CAMLY_CONTRACT_ADDRESS, ERC20_ABI, provider);
    const decimals = await camlyContract.decimals();
    const camlyBalanceRaw = await camlyContract.balanceOf(rewardWalletAddress);
    const camlyBalance = parseFloat(ethers.formatUnits(camlyBalanceRaw, decimals));

    console.log(`Reward wallet ${rewardWalletAddress}: ${camlyBalance} CAMLY, ${bnbBalance} BNB`);

    return new Response(
      JSON.stringify({
        success: true,
        wallet_address: rewardWalletAddress,
        camly_balance: Math.round(camlyBalance),
        bnb_balance: bnbBalance,
        checked_at: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error checking reward wallet balance:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
