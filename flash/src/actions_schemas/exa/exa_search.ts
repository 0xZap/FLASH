import { z } from "zod";

export const EXA_SEARCH_ACTION_NAME = "exa_search";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Exa search tool inputs
 */
export const ExaSearchSchema = z.object({
    query: z.string().min(1).describe("The search query to find relevant content"),
    limit: z.number().optional().default(5).describe("Maximum number of results to return"),
    include_domains: z.array(z.string()).optional().describe("List of domains to include in search"),
    exclude_domains: z.array(z.string()).optional().describe("List of domains to exclude from search"),
    retrieve_content: z.boolean().optional().default(true).describe("Whether to retrieve full content of search results"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Documentation for the AI on how to use this tool
   */
  export const EXA_SEARCH_PROMPT = `
  This tool searches the web using Exa AI and returns relevant content based on a query.
  
  Required inputs:
  - query: The search query to find relevant content (must be at least 1 character)
  
  Optional inputs:
  - limit: Maximum number of results to return (default: 5)
  - include_domains: List of domains to include in search (e.g. ["example.com", "example.org"])
  - exclude_domains: List of domains to exclude from search (e.g. ["example.net"])
  - retrieve_content: Whether to retrieve full content of search results (default: true)
  
  Examples:
  - Basic search: { "query": "climate change solutions" }
  - Limited search: { "query": "machine learning tutorials", "limit": 3 }
  - Domain-specific search: { "query": "javascript frameworks", "include_domains": ["dev.to", "medium.com"] }
  
  Important notes:
  - Requires a valid Exa API key
  - More specific queries yield better results
  - Content retrieval may increase response time
  `;