import { z } from "zod";
import { ZapAction } from "../zap_action";
import { EthereumConfig } from "../../config/ethereum_config";
import { WalletProvider } from "./utils/wallet";
import { SupportedChain } from "./utils/types";
import { privateKeyToAccount } from "viem/accounts";
import { Chain, parseEther, type Hex } from "viem";

// Schema for transfer parameters
const TransferSchema = z.object({
  fromChain: z
    .enum(["sepolia", "base"] as const)
    .describe("Chain to transfer from (e.g., 'sepolia', 'base')"),
  toAddress: z
    .string()
    .describe("Destination wallet address"),
  amount: z
    .string()
    .describe("Amount to transfer in native token units"),
  data: z
    .string()
    .optional()
    .describe("Additional transaction data")
}).strict();

const TRANSFER_PROMPT = `
This tool allows you to transfer tokens between addresses on supported chains.

Required inputs:
- fromChain: The source chain (e.g., "sepolia", "base")
- toAddress: The destination wallet address
- amount: Amount to transfer in native token units
- data: (Optional) Additional transaction data

Important notes:
- Requires valid private key for authentication
- Supports Sepolia and Base networks
- Returns transaction hash and details
`;

/**
 * Transfer tokens between addresses on supported chains
 * @param params Transfer parameters including chain, address, and amount
 * @returns Transaction details or error message
 */
export async function transfer(params: z.infer<typeof TransferSchema>) {
  const config = EthereumConfig.getInstance();
  const privateKey = config.getPrivateKey();

  if (!privateKey) {
    throw new Error("Ethereum private key not found");
  }

  try {
    const walletProvider = new WalletProvider();
    const walletClient = walletProvider.getWalletClient();
    const [fromAddress] = await walletClient.getAddresses();
    const account = privateKeyToAccount(privateKey as `0x${string}`);

    const hash = await walletClient.sendTransaction({
      account,
      to: params.toAddress as `0x${string}`,
      value: parseEther(params.amount),
      data: params.data as Hex,
      chain: walletProvider.getChainConfig(params.fromChain as SupportedChain).chain as Chain,
    });

    return JSON.stringify({
      hash,
      from: fromAddress,
      to: params.toAddress,
      value: parseEther(params.amount).toString(),
      data: params.data as Hex,
    }, null, 2);

  } catch (error) {
    throw new Error(`Transfer failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Action class for transferring tokens between addresses
 */
export class TransferAction implements ZapAction<typeof TransferSchema> {
  public name = "transfer";
  public description = TRANSFER_PROMPT;
  public schema = TransferSchema;
  public func = (args: { [key: string]: any }) => 
    transfer({
      fromChain: args.fromChain,
      toAddress: args.toAddress,
      amount: args.amount,
      data: args.data
    });
}

// Type exports for use in tests
export type TransferRequest = z.infer<typeof TransferSchema>;