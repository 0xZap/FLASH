import { z } from "zod";

export type ZapActionSchema = z.ZodObject<
  {
    [K: string]: z.ZodTypeAny;
  },
  "strict",
  z.ZodTypeAny
>;

/**
 * Core Zap Actions interface.
 */
export interface ZapAction<TSchema extends ZapActionSchema> {
  name: string;
  description: string;
  schema: TSchema;
  func: (args: z.infer<TSchema>) => Promise<string>;
}
