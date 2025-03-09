import { StructuredTool } from "@langchain/core/tools";
import { ZapAction, ZapActionSchema } from "@0xzap/flash";
import { z } from "zod";

/**
 * A tool class that wraps a Zap action for use with LangChain
 *
 */
export class ZapTool<TActionSchema extends ZapActionSchema> extends StructuredTool {
  public schema: TActionSchema;
  public name: string;
  public description: string;
  private action: ZapAction<TActionSchema>;

  /**
   * Constructor for the Zap Tool class
   *
   * @param action - The Zap action to execute
   */
  constructor(action: ZapAction<TActionSchema>) {
    super();
    this.action = action;
    this.name = action.name;
    this.description = action.description.slice(0, 1000);
    this.schema = action.schema;
  }

  /**
   * Executes the Zap action with the provided input
   *
   * @param input - An object containing either instructions or schema-validated arguments
   * @returns A promise that resolves to the result of the Zap action
   * @throws {Error} If the Zap action fails
   */
  protected async _call(
    input: z.infer<typeof this.schema> & Record<string, unknown>,
  ): Promise<string> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let args: any;

      // If we have a schema, try to validate against it
      if (this.schema) {
        try {
          const validatedInput = this.schema.parse(input);
          args = validatedInput;
        } catch (validationError) {
          // If schema validation fails, fall back to instructions-only mode
          args = input;
        }
      } else {
        args = input;
      }

      return await this.action.func(args);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return `Error executing ${this.name}: ${error.message}`;
      }
      return `Error executing ${this.name}: Unknown error occurred`;
    }
  }
}
