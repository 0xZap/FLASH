import {
    createPublicClient,
    createWalletClient,
    http,
    formatUnits,
    type PublicClient,
    type WalletClient,
    type Chain,
    type HttpTransport,
    type Address,
    Account,
  } from "viem";
  import { chains } from "./chains";
  import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
  import { ChainConfig, SupportedChain } from "./types";
  import { EthereumConfig } from "../../../config/ethereum_config";


  export const getChainConfigs = () => {
    return chains;
  };
  
  export class WalletProvider {
    private chainConfigs: Record<SupportedChain, ChainConfig>;
    private currentChain: SupportedChain = "sepolia";
    private address: Address;
    private privateKey: `0x${string}`;
  
    constructor() {
      // Generate or use existing private key
      this.privateKey = this.initializePrivateKey();
      const account = privateKeyToAccount(this.privateKey);
      this.address = account.address;
  
      const createClients = (chain: SupportedChain): ChainConfig => {
        const config = getChainConfigs()[chain];
        const transport = http(config.rpcUrl);
        
        return {
          chain: config.chain as Chain,
          publicClient: createPublicClient({
            chain: config.chain as Chain, 
            transport
          }),
          walletClient: createWalletClient({
            chain: config.chain as Chain,
            transport,
            account
          })
        };
      };
  
      this.chainConfigs = {
        sepolia: createClients("sepolia"),
        base: createClients("base"),
      };
    }
  
    private initializePrivateKey(): `0x${string}` {
      try {
        const config = EthereumConfig.getInstance();
        return config.getPrivateKey() as `0x${string}`;
      } catch (error) {
        // Generate new private key if none exists
        const newPrivateKey = generatePrivateKey();
        console.log("Generated new wallet private key:", newPrivateKey);
        return newPrivateKey;
      }
    }
  
    getPrivateKey(): `0x${string}` {
      return this.privateKey;
    }

    getAddress(): Address {
        return this.address;
    }

    async getWalletBalance(): Promise<string | null> {
        try {
            const client = this.getPublicClient(this.currentChain);
            const walletClient = this.getWalletClient();
            if(walletClient.account) {
                const balance = await client.getBalance({
                address: walletClient.account.address,
                });
                return formatUnits(balance, 18);
            }
            else {
                return null;
            }
        } catch (error) {
            console.error("Error getting wallet balance:", error);
            return null;
        }
    }

    async connect(): Promise<`0x${string}`> {
        return this.privateKey;
    }

    async switchChain(
        chain: SupportedChain
    ): Promise<void> {
        const walletClient = this.chainConfigs[this.currentChain].walletClient;
        if (!walletClient) throw new Error("Wallet not connected");

        try {
            await walletClient.switchChain({
                id: getChainConfigs()[chain].chainId,
            });
        } catch (error: any) {
            if (error.code === 4902) {
                console.log(
                    "[WalletProvider] Chain not added to wallet (error 4902) - attempting to add chain first"
                );
                await walletClient.addChain({
                    chain: {
                        ...getChainConfigs()[chain].chain,
                        rpcUrls: {
                            default: {
                                http: [getChainConfigs()[chain].rpcUrl],
                            },
                            public: {
                                http: [getChainConfigs()[chain].rpcUrl],
                            },
                        },
                    },
                });
                await walletClient.switchChain({
                    id: getChainConfigs()[chain].chainId,
                });
            } else {
                throw error;
            }
        }

        this.currentChain = chain;
    }

    getPublicClient(
        chain: SupportedChain
    ): PublicClient<HttpTransport, Chain, Account | undefined> {
        return this.chainConfigs[chain].publicClient;
    }

    getWalletClient(): WalletClient {
        const walletClient = this.chainConfigs[this.currentChain].walletClient;
        if (!walletClient) throw new Error("Wallet not connected");
        return walletClient;
    }

    getCurrentChain(): SupportedChain {
        return this.currentChain;
    }

    getChainConfig(chain: SupportedChain) {
        return getChainConfigs()[chain];
    }
}

export const ethereumWalletProvider = {
    async get(): Promise<string | null> {
      try {
        const walletProvider = new WalletProvider();
        const address = walletProvider.getAddress();
        const balance = await walletProvider.getWalletBalance();
        const privateKey = walletProvider.getPrivateKey();
        
        return `Ethereum Wallet Address: ${address}
  Private Key: ${privateKey}
  Balance: ${balance} ETH`;
      } catch (error) {
        console.error("Error in Ethereum wallet provider:", error);
        return null;
      }
    },
  };