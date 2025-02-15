import type {
    Account,
    Address,
    Chain,
    Hash,
    HttpTransport,
    PublicClient,
    WalletClient,
} from "viem";

export type SupportedChain = "sepolia" | "base";

export interface ChainConfig {
    chain: Chain;
    publicClient: PublicClient<HttpTransport, Chain, Account | undefined>;
    walletClient: WalletClient;
}

export type ChainMetadata = {
    chainId: number;
    name: string;
    chain: Chain;
    rpcUrl: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    blockExplorerUrl: string;
}

export type Chains = {
    "sepolia": ChainMetadata;
    "base": ChainMetadata;
}

export interface TransferParams {
    fromChain: SupportedChain;
    toAddress: Address;
    amount: string;
    data?: `0x${string}`;
}

export interface Transaction {
    hash: Hash;
    from: Address;
    to: Address;
    value: string;
    data?: `0x${string}`;
    chainId?: number;
}