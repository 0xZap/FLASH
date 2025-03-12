import { z } from "zod";
import { ZapAction } from "../zap_action";
import { EthereumConfig } from "../../config/ethereum_config";
import { WalletProvider } from "./utils/wallet";
import { SupportedChain } from "./utils/types";
import { privateKeyToAccount } from "viem/accounts";
import { Chain, parseEther, type Hex } from "viem";
import { TransferSchema, TRANSFER_PROMPT, TRANSFER_ACTION_NAME } from "../../actions_schemas/ethereum/transfer";


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
  public name = TRANSFER_ACTION_NAME;
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