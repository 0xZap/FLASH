 /* 
 TEST EXA AI TOOLS 
 
 1. Missing API KEY Handle
 2. Functions
 3. API Calls - Handle API Errors
 4. Wrong request params handle
 */

import { ExaSearchAction } from "../../actions/exa/exa_search";
import { ExaConfig } from "../../config/exa_config";
import dotenv from "dotenv";

dotenv.config();
// Initialize these variables outside the test function so we can recreate them
let exaSearchAction: ExaSearchAction;
let exaConfig: ExaConfig;

async function testExaSearchAction() {
    // Test 1: Missing API KEY Handle
    try {
        ExaConfig.resetInstance();
        exaConfig = ExaConfig.getInstance({
            apiKey: undefined // Explicitly set undefined to test missing API key
        });
        exaSearchAction = new ExaSearchAction();
        
        const searchResult = await exaSearchAction.func({
            query: "What is the price of Bitcoin?",
            limit: 10,
            include_domains: ["https://www.coingecko.com"],
            exclude_domains: ["https://www.coingecko.com/en/coins/bitcoin"],
            retrieve_content: true
        });
        console.error("Test 1 Failed - Should have thrown an error");
    } catch (error) {
        console.log("Test 1 Passed - Successfully caught missing API key error");
    }

    // Test 2: Functions
    try {
        ExaConfig.resetInstance();
        exaConfig = ExaConfig.getInstance({
            apiKey: process.env.EXA_API_KEY
        });
        exaSearchAction = new ExaSearchAction();
        
        const searchResult = await exaSearchAction.func({
            query: "What is the price of Bitcoin?",
            limit: 10,
            retrieve_content: true
        });
        
        if (searchResult.includes("results for")) {
            console.log("Test 2 Passed");
        } else {
            console.error("Test 2 Failed");
        }
    } catch (error) {
        console.error("Test 2 Failed:", error);
    }

    // Test 3: API calls 
    /* NO API calls for this tools, but one should check: 
    *   1. types
    *   2. params
    *   3. return types
    *   4. handle errors
    *   5. handle rate limits
    *   6. handle timeouts
    *   7. handle retries
    */

    // Test 4: Wrong request params handle
    try {
        const searchResult = await exaSearchAction.func({
            // @ts-ignore - intentionally passing wrong params for testing
            retries: 10,
            include_domains: ["https://www.coingecko.com"],
            exclude_domains: ["https://www.coingecko.com/en/coins/bitcoin"],
            retrieve_content: true,
            url: "https://www.coingecko.com"
        });
        console.error("Test 4 Failed - Should have thrown an error");
    } catch (error) {
        console.log("Test 4 Passed - Successfully caught invalid params error");
    }
}

export async function runExaTests() {
    await testExaSearchAction();
}
