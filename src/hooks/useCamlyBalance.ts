import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { CAMLY_CONTRACT_ADDRESS, CAMLY_ABI } from '@/lib/web3';

const CAMLY_DECIMALS = 3;

export const useCamlyBalance = () => {
  const { address, isConnected } = useAccount();

  const { data: balanceData, isLoading, refetch, isError } = useReadContract({
    address: CAMLY_CONTRACT_ADDRESS as `0x${string}`,
    abi: CAMLY_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
      refetchInterval: 10000, // Refresh every 10 seconds
    },
  });

  const balance = balanceData 
    ? Number(formatUnits(balanceData as bigint, CAMLY_DECIMALS))
    : 0;

  return {
    balance,
    isLoading,
    isError,
    refetch,
    isConnected,
    walletAddress: address,
  };
};
