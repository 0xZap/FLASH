import { z } from "zod";

export const TRANSFER_ACTION_NAME = "transfer";

export const TransferSchema = z.object({
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
  
export const TRANSFER_PROMPT = `
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