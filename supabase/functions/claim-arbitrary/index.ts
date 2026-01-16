import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ethers } from "https://esm.sh/ethers@6.13.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CAMLY Token contract on BSC
const CAMLY_CONTRACT_ADDRESS = "0x0910320181889fefde0bb1ca63962b0a8882e413";

// Multiple BSC RPC endpoints for fallback
const BSC_RPC_URLS = [
  "https://bsc-dataseed1.binance.org/",
  "https://bsc-dataseed2.binance.org/",
  "https://bsc-dataseed3.binance.org/",
  "https://bsc-dataseed4.binance.org/",
  "https://bsc.publicnode.com",
  "https://binance.llamarpc.com",
];

// ERC20 Transfer ABI
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

// Helper function to get working provider with retry
async function getWorkingProvider(): Promise<ethers.JsonRpcProvider> {
  for (const rpcUrl of BSC_RPC_URLS) {
    try {
      console.log(`🔗 Trying RPC: ${rpcUrl}`);
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      // Test connection by getting block number with timeout
      const blockPromise = provider.getBlockNumber();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      await Promise.race([blockPromise, timeoutPromise]);
      console.log(`✅ Connected to RPC: ${rpcUrl}`);
      return provider;
    } catch (error) {
      console.warn(`❌ RPC ${rpcUrl} failed:`, error);
    }
  }
  throw new Error('All RPC endpoints failed');
}

// Helper to send transaction with retry
async function sendTransactionWithRetry(
  wallet: ethers.Wallet,
  contract: ethers.Contract,
  walletAddress: string,
  amountWithDecimals: bigint,
  maxRetries: number = 3
): Promise<ethers.TransactionReceipt> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📤 Attempt ${attempt}/${maxRetries}: Sending TX to ${walletAddress}`);
      
      // Get current gas price with some buffer
      const feeData = await wallet.provider!.getFeeData();
      const gasPrice = feeData.gasPrice ? feeData.gasPrice * BigInt(120) / BigInt(100) : undefined;
      
      // Estimate gas
      const gasEstimate = await contract.transfer.estimateGas(walletAddress, amountWithDecimals);
      const gasLimit = gasEstimate * BigInt(120) / BigInt(100); // 20% buffer
      
      console.log(`⛽ Gas estimate: ${gasEstimate}, Gas limit: ${gasLimit}, Gas price: ${gasPrice}`);
      
      // Execute transfer with explicit gas settings
      const tx = await contract.transfer(walletAddress, amountWithDecimals, {
        gasLimit,
        gasPrice,
      });
      
      console.log(`📝 TX submitted: ${tx.hash}`);
      
      // Wait for confirmation with timeout
      const receiptPromise = tx.wait(1); // Wait for 1 confirmation
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TX confirmation timeout after 60s')), 60000)
      );
      
      const receipt = await Promise.race([receiptPromise, timeoutPromise]) as ethers.TransactionReceipt;
      
      if (receipt.status === 0) {
        throw new Error('Transaction reverted on chain');
      }
      
      console.log(`✅ TX confirmed: ${receipt.hash}, Block: ${receipt.blockNumber}`);
      return receipt;
      
    } catch (error: any) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      // Don't retry for certain errors
      if (error.message?.includes('insufficient funds') || 
          error.message?.includes('nonce too low') ||
          error.message?.includes('already known')) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(r => setTimeout(r, delay));
        
        // Try to get a new provider for next attempt
        try {
          const newProvider = await getWorkingProvider();
          wallet = wallet.connect(newProvider);
          contract = new ethers.Contract(CAMLY_CONTRACT_ADDRESS, ERC20_ABI, wallet);
        } catch (e) {
          console.warn('Failed to switch provider:', e);
        }
      }
    }
  }
  
  throw lastError;
}

serve(async (req) => {
  const timestamp = new Date().toISOString();
  console.log(`🚀 [${timestamp}] claim-arbitrary function called`);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const rewardWalletPrivateKey = Deno.env.get('CAMLY_REWARD_WALLET_PRIVATE_KEY');
    
    if (!rewardWalletPrivateKey) {
      console.error('❌ CAMLY_REWARD_WALLET_PRIVATE_KEY not configured');
      return new Response(JSON.stringify({ error: 'Wallet not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ No authorization header');
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { walletAddress, amount, parentSignature } = body;

    // Get user profile for better logging
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, wallet_address')
      .eq('id', user.id)
      .single();

    console.log(`📋 [${timestamp}] ========== WITHDRAWAL REQUEST ==========`);
    console.log(`👤 User ID: ${user.id}`);
    console.log(`📛 Username: ${profile?.username || 'N/A'}`);
    console.log(`💰 Amount: ${amount} CAMLY`);
    console.log(`📬 Target Wallet: ${walletAddress}`);
    console.log(`🔗 Profile Wallet: ${profile?.wallet_address || 'NOT CONNECTED'}`);

    // Validate inputs
    if (!walletAddress || !amount || amount <= 0) {
      console.error('❌ Invalid inputs:', { walletAddress, amount });
      return new Response(JSON.stringify({ error: 'Invalid walletAddress or amount' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is a child requiring parent approval
    const { data: childLink } = await supabase
      .from('parent_child_links')
      .select('parent_id')
      .eq('child_id', user.id)
      .eq('status', 'approved')
      .maybeSingle();

    if (childLink && !parentSignature) {
      console.log('👶 Child account requires parent approval');
      return new Response(JSON.stringify({ 
        error: 'Parent approval required',
        requiresParentApproval: true,
        parentId: childLink.parent_id
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use Smart Auto-Approve system via process_withdrawal_request
    console.log('📋 Calling process_withdrawal_request...');
    const { data: withdrawalResult, error: withdrawalError } = await supabase
      .rpc('process_withdrawal_request', {
        p_user_id: user.id,
        p_wallet_address: walletAddress,
        p_amount: amount
      });

    if (withdrawalError) {
      console.error('❌ Withdrawal request error:', withdrawalError);
      return new Response(JSON.stringify({ error: 'Failed to process withdrawal request' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📋 [${timestamp}] Withdrawal result:`, JSON.stringify(withdrawalResult));

    if (!withdrawalResult.success) {
      console.log(`❌ [${timestamp}] Withdrawal REJECTED for ${profile?.username}: ${withdrawalResult.error}`);
      return new Response(JSON.stringify({ 
        error: withdrawalResult.error,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ [${timestamp}] Withdrawal request created: ${withdrawalResult.request_id}`);
    console.log(`🔐 [${timestamp}] User: ${profile?.username}, Status: ${withdrawalResult.status}`);

    // If not approved (fraud suspect or blacklisted), return pending status
    if (withdrawalResult.status !== 'approved') {
      console.log(`⏳ [${timestamp}] PENDING REVIEW: User ${profile?.username} requesting ${amount} CAMLY - Status: ${withdrawalResult.status}`);
      console.log(`📋 [${timestamp}] ========== END (PENDING) ==========`);
      return new Response(JSON.stringify({ 
        success: true,
        status: 'pending_review',
        withdrawal_id: withdrawalResult.request_id,
        message: 'Your withdrawal is pending admin review. You will be notified when approved.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auto-approved: Process the on-chain transfer
    // IMPORTANT: TX-first flow - only deduct pending after successful TX
    console.log(`🔗 [${timestamp}] Starting on-chain transfer for ${profile?.username}...`);
    
    let provider: ethers.JsonRpcProvider | null = null;
    let wallet: ethers.Wallet | null = null;
    let contract: ethers.Contract | null = null;
    
    try {
      // Step 1: Get working provider
      console.log(`📡 [${timestamp}] Step 1: Connecting to BSC RPC...`);
      try {
        provider = await getWorkingProvider();
        console.log(`✅ [${timestamp}] RPC connected successfully`);
      } catch (rpcError: any) {
        console.error(`❌ [${timestamp}] RPC CONNECTION FAILED:`, rpcError.message);
        throw new Error(`RPC connection failed: ${rpcError.message}`);
      }
      
      // Step 2: Initialize wallet
      console.log(`🔑 [${timestamp}] Step 2: Initializing reward wallet...`);
      try {
        wallet = new ethers.Wallet(rewardWalletPrivateKey, provider);
        console.log(`✅ [${timestamp}] Wallet initialized: ${wallet.address}`);
      } catch (walletError: any) {
        console.error(`❌ [${timestamp}] WALLET INIT FAILED:`, walletError.message);
        throw new Error(`Wallet initialization failed: ${walletError.message}`);
      }
      
      // Step 3: Check BNB balance for gas
      console.log(`⛽ [${timestamp}] Step 3: Checking BNB balance for gas...`);
      try {
        const bnbBalance = await provider.getBalance(wallet.address);
        const bnbFormatted = ethers.formatEther(bnbBalance);
        console.log(`💰 [${timestamp}] BNB Balance: ${bnbFormatted} BNB`);
        
        if (bnbBalance < ethers.parseEther("0.001")) {
          console.error(`❌ [${timestamp}] INSUFFICIENT BNB FOR GAS: ${bnbFormatted} BNB`);
          throw new Error(`Insufficient BNB for gas: ${bnbFormatted} BNB (need at least 0.001 BNB)`);
        }
      } catch (bnbError: any) {
        if (bnbError.message.includes('Insufficient BNB')) throw bnbError;
        console.error(`❌ [${timestamp}] BNB CHECK FAILED:`, bnbError.message);
        throw new Error(`Failed to check BNB balance: ${bnbError.message}`);
      }
      
      // Step 4: Initialize contract
      console.log(`📋 [${timestamp}] Step 4: Initializing CAMLY contract...`);
      contract = new ethers.Contract(CAMLY_CONTRACT_ADDRESS, ERC20_ABI, wallet);

      // Step 5: Check CAMLY balance
      console.log(`🪙 [${timestamp}] Step 5: Checking CAMLY balance...`);
      const walletBalance = await contract.balanceOf(wallet.address);
      const decimals = 3;
      const amountWithDecimals = BigInt(Math.floor(amount)) * BigInt(10 ** decimals);
      
      console.log(`💼 [${timestamp}] Reward wallet CAMLY: ${ethers.formatUnits(walletBalance, decimals)} CAMLY`);
      console.log(`📤 [${timestamp}] Transfer amount: ${amount} CAMLY (${amountWithDecimals} wei)`);

      if (walletBalance < amountWithDecimals) {
        console.error(`❌ [${timestamp}] INSUFFICIENT CAMLY BALANCE`);
        console.error(`   Required: ${amount} CAMLY, Available: ${ethers.formatUnits(walletBalance, decimals)} CAMLY`);
        
        // Rollback - add back pending amount
        await supabase.rpc('add_user_pending_reward', {
          p_user_id: user.id,
          p_amount: amount,
          p_source: 'rollback_insufficient_balance'
        });
        
        // Mark withdrawal as failed and notify admin
        await supabase
          .from('withdrawal_requests')
          .update({ 
            status: 'failed',
            admin_notes: `Insufficient CAMLY in reward wallet. Required: ${amount}, Available: ${ethers.formatUnits(walletBalance, decimals)}`
          })
          .eq('id', withdrawalResult.request_id);
        
        // Create admin notification
        await supabase
          .from('admin_realtime_notifications')
          .insert({
            notification_type: 'withdrawal_failed',
            title: 'Withdrawal Failed - Insufficient CAMLY',
            message: `Withdrawal for ${profile?.username} failed. Reward wallet needs more CAMLY.`,
            priority: 'high',
            data: { 
              user_id: user.id, 
              username: profile?.username,
              amount: amount, 
              available: ethers.formatUnits(walletBalance, decimals),
              withdrawal_id: withdrawalResult.request_id
            }
          });

        return new Response(JSON.stringify({ 
          error: 'Ví thưởng tạm thời không đủ CAMLY. Vui lòng thử lại sau hoặc liên hệ admin.' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Step 6: Send transaction with retry logic
      console.log(`📤 [${timestamp}] Step 6: Sending transaction...`);
      const receipt = await sendTransactionWithRetry(
        wallet, 
        contract, 
        walletAddress, 
        amountWithDecimals
      );

      console.log(`🎉 [${timestamp}] TX SUCCESS for ${profile?.username}: ${receipt.hash}`);

      // Update withdrawal request status to completed
      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'completed',
          tx_hash: receipt.hash,
          completed_at: new Date().toISOString()
        })
        .eq('id', withdrawalResult.request_id);

      if (updateError) {
        console.error(`⚠️ [${timestamp}] Error updating withdrawal status:`, updateError);
      }

      // Log the claim in daily_claim_logs
      await supabase
        .from('daily_claim_logs')
        .insert({
          user_id: user.id,
          amount_claimed: amount,
          tx_hash: receipt.hash
        });

      // Also log in camly_claims for history
      await supabase
        .from('camly_claims')
        .insert({
          user_id: user.id,
          wallet_address: walletAddress,
          claim_type: 'arbitrary' as any,
          amount: amount,
          status: 'completed',
          tx_hash: receipt.hash,
          claimed_at: new Date().toISOString(),
        });

      console.log(`✅ [${timestamp}] All database updates completed for ${profile?.username}`);
      console.log(`📋 [${timestamp}] ========== END (COMPLETED) ==========`);

      return new Response(JSON.stringify({ 
        success: true, 
        status: 'completed',
        txHash: receipt.hash,
        amount: amount
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (txError: any) {
      console.error(`❌ [${timestamp}] TRANSACTION ERROR for ${profile?.username}:`);
      console.error(`   Message: ${txError.message}`);
      console.error(`   Code: ${txError.code || 'N/A'}`);
      console.error(`   Reason: ${txError.reason || 'N/A'}`);
      console.error(`   Full error:`, JSON.stringify(txError, Object.getOwnPropertyNames(txError)));
      
      // Mark withdrawal as failed
      await supabase
        .from('withdrawal_requests')
        .update({ 
          status: 'failed',
          admin_notes: `TX error: ${txError.message?.substring(0, 200)}`
        })
        .eq('id', withdrawalResult.request_id);

      // Rollback - add back pending amount
      console.log(`🔄 [${timestamp}] Rolling back pending amount for ${profile?.username}...`);
      const { error: rollbackError } = await supabase.rpc('add_user_pending_reward', {
        p_user_id: user.id,
        p_amount: amount,
        p_source: 'rollback_tx_failed'
      });

      if (rollbackError) {
        console.error(`⚠️ [${timestamp}] Rollback error:`, rollbackError);
      } else {
        console.log(`✅ [${timestamp}] Rollback completed for ${profile?.username}`);
      }
      
      // Create admin notification for failed TX
      await supabase
        .from('admin_realtime_notifications')
        .insert({
          notification_type: 'withdrawal_failed',
          title: 'Withdrawal TX Failed',
          message: `TX failed for ${profile?.username}: ${txError.message?.substring(0, 100)}`,
          priority: 'high',
          data: { 
            user_id: user.id, 
            username: profile?.username,
            amount: amount, 
            error: txError.message,
            withdrawal_id: withdrawalResult.request_id
          }
        });

      console.log(`📋 [${timestamp}] ========== END (FAILED) ==========`);

      return new Response(JSON.stringify({ 
        error: 'Giao dịch thất bại. Số dư của bạn đã được hoàn trả. Vui lòng thử lại sau.',
        details: txError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('❌ Error in claim-arbitrary:', error.message);
    console.error('Full error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
