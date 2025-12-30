-- Add columns for on-chain donation tracking
ALTER TABLE public.platform_donations 
ADD COLUMN IF NOT EXISTS is_onchain BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tx_hash TEXT,
ADD COLUMN IF NOT EXISTS wallet_address TEXT,
ADD COLUMN IF NOT EXISTS donation_type TEXT DEFAULT 'internal';

-- Add index for efficient querying of on-chain donations
CREATE INDEX IF NOT EXISTS idx_platform_donations_onchain ON public.platform_donations(is_onchain) WHERE is_onchain = true;
CREATE INDEX IF NOT EXISTS idx_platform_donations_tx_hash ON public.platform_donations(tx_hash) WHERE tx_hash IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.platform_donations.is_onchain IS 'Whether this is a real on-chain CAMLY token transfer';
COMMENT ON COLUMN public.platform_donations.tx_hash IS 'BSC transaction hash for on-chain donations';
COMMENT ON COLUMN public.platform_donations.wallet_address IS 'Wallet address used for on-chain donation';
COMMENT ON COLUMN public.platform_donations.donation_type IS 'internal (off-chain balance) or onchain (real token transfer)';