import { ChainMetadata, Chains, SupportedChain } from './types.js';
import { sepolia, base } from 'viem/chains';

export const chains: Record<SupportedChain, ChainMetadata> = {
    sepolia: {
        chainId: 11155111,  
        name: "Sepolia",
        chain: sepolia,
        rpcUrl: "https://ethereum-sepolia.rpc.subquery.network/public",
        nativeCurrency: {
            name: "Sepolia Ether",
            symbol: "ETH",
            decimals: 18,
        },
        blockExplorerUrl: "https://sepolia.etherscan.io",
     },
    base: {
        chainId: 8453,
        name: "Base",
        chain: base,
        rpcUrl: "https://base.llamarpc.com",
        nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
        },
        blockExplorerUrl: "https://basescan.org",
    }
    }
