import { z } from "zod";
import { ZapAction } from "../zap_action";
import Exa from "exa-js";
import { ExaConfig } from "../../config/exa_config";
import { ExaSearchSchema, EXA_SEARCH_PROMPT, EXA_SEARCH_ACTION_NAME } from "../../actions_schemas/exa/exa_search";


/**
 * Step 3: Implement Tool Function
 * 
 * Function that performs the Exa search
 * @param inputs The search parameters
 * @returns Formatted search results
 */
export async function exaSearch(inputs: z.infer<typeof ExaSearchSchema>): Promise<string> {
  // Get API key from configuration
  const config = ExaConfig.getInstance();
  const apiKey = config.getApiKey();
  
  if (!apiKey) {
    throw new Error("Exa API key not found. Please set it in your configuration.");
  }
  
  try {
    // Initialize Exa client
    const exa = new Exa(apiKey);
    
    // Prepare search options
    const searchOptions: any = {
      numResults: inputs.limit,
      text: inputs.retrieve_content,
    };
    
    // Add domain filters if provided
    if (inputs.include_domains && inputs.include_domains.length > 0) {
      searchOptions.includeDomains = inputs.include_domains;
    }
    
    if (inputs.exclude_domains && inputs.exclude_domains.length > 0) {
      searchOptions.excludeDomains = inputs.exclude_domains;
    }
    
    // Execute search
    const results = await exa.searchAndContents(inputs.query, searchOptions);
    
    // Format results
    if (!results.results || results.results.length === 0) {
      return "No results found for your query.";
    }
    
    // Build formatted response
    let formattedResponse = `Found ${results.results.length} results for "${inputs.query}":\n\n`;
    
    results.results.forEach((result: any, index: number) => {
      formattedResponse += `${index + 1}. ${result.title}\n`;
      formattedResponse += `   URL: ${result.url}\n`;
      
      if (result.text && inputs.retrieve_content) {
        // Truncate content if it's too long
        const contentPreview = result.text.length > 300 
          ? result.text.substring(0, 300) + "..." 
          : result.text;
        formattedResponse += `   Content: ${contentPreview}\n`;
      }
      
      formattedResponse += "\n";
    });
    
    return formattedResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Exa search failed: ${error.message}`);
    }
    throw new Error("Exa search failed with an unknown error");
  }
}

/**
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class ExaSearchAction implements ZapAction<typeof ExaSearchSchema> {
  public name = EXA_SEARCH_ACTION_NAME;
  public description = EXA_SEARCH_PROMPT;
  public schema = ExaSearchSchema;
  public config = ExaConfig.getInstance();
  public func = (args: { [key: string]: any }) => 
    exaSearch({
      query: args.query,
      limit: args.limit,
      include_domains: args.include_domains,
      exclude_domains: args.exclude_domains,
      retrieve_content: args.retrieve_content,
    });
}

// Export types for testing
export type ExaSearchRequest = z.infer<typeof ExaSearchSchema>; 