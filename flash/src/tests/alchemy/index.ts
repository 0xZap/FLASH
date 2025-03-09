import { 
    GetTokenPricesAction,
    GetTokenBalancesAction,
    GetTransactionAction,
    GetBlockAction,
    EstimateGasAction,
    GetGasPriceAction
  } from "../../actions/onchain_data/alchemy";
  import { AlchemyConfig } from "../../config/alchemy_config";
  import dotenv from "dotenv";
  
  dotenv.config();
  
  // Initialize variables outside test functions
  let alchemyConfig: AlchemyConfig;
  let getTokenPricesAction: GetTokenPricesAction;
  let getTokenBalancesAction: GetTokenBalancesAction;
  let getTransactionAction: GetTransactionAction;
  let getBlockAction: GetBlockAction;
  let estimateGasAction: EstimateGasAction;
  let getGasPriceAction: GetGasPriceAction;
  
  async function testAlchemyActions() {
      // Test 1: Missing API KEY Handle
      try {
          AlchemyConfig.resetInstance();
          alchemyConfig = AlchemyConfig.getInstance({
              apiKey: undefined // Explicitly set undefined to test missing API key
          });
          getTokenPricesAction = new GetTokenPricesAction();
          
          const priceResult = await getTokenPricesAction.func({
              symbols: ["ETH"],
              currencies: ["USD"]
          });
          console.error("Test 1 Failed - Should have thrown API key error");
      } catch (error) {
          console.log("Test 1 Passed - Successfully caught missing API key error");
      }
  
      // Test 2: Functions Existence
      try {
          AlchemyConfig.resetInstance();
          alchemyConfig = AlchemyConfig.getInstance({
              apiKey: process.env.ALCHEMY_API_KEY
          });
  
          getTokenPricesAction = new GetTokenPricesAction();
          getTokenBalancesAction = new GetTokenBalancesAction();
          getTransactionAction = new GetTransactionAction();
          getBlockAction = new GetBlockAction();
          estimateGasAction = new EstimateGasAction();
          getGasPriceAction = new GetGasPriceAction();
  
          const actions = [
              getTokenPricesAction,
              getTokenBalancesAction,
              getTransactionAction,
              getBlockAction,
              estimateGasAction,
              getGasPriceAction
          ];
  
          actions.forEach(action => {
              if (!action.name || !action.description || !action.schema || !action.func) {
                  throw new Error(`Missing required properties in ${action.constructor.name}`);
              }
          });
  
          console.log("Test 2 Passed - All functions exist and are properly structured");
      } catch (error) {
          console.error("Test 2 Failed -", error);
      }
  
      // Test 3: API Calls - Handle API Errors
      try {
          getTokenPricesAction = new GetTokenPricesAction();
          const result = await getTokenPricesAction.func({
              symbols: ["INVALID_TOKEN"],
              currencies: ["USD"]
          });
          if (result.includes("INVALID_TOKEN")) {
            console.log("Test 3 Passed - Successfully caught API error");
          } else {
            console.error("Test 3 Failed - Should have thrown API error");
          }
      } catch (error) {
          console.log("Test 3 Passed - Successfully caught API error");
      }
  
      // Test 4: Wrong Request Params Handle
      try {
          estimateGasAction = new EstimateGasAction();
          const result = await estimateGasAction.func({
              transaction: {
                  // Invalid transaction params
                  to: "invalid_address",
                  value: "not_a_number"
              },
              network: "INVALID_NETWORK"
          });
          if (result.includes("Gas estimation failed")) {
            console.log("Test 4 Passed - Successfully caught invalid params error");
          } else {
            console.error("Test 4 Failed - Should have thrown invalid params error");
          }
      } catch (error) {
          console.log("Test 4 Passed - Successfully caught invalid params error");
      }
  
      // Test 5: Network Support
      try {
          getGasPriceAction = new GetGasPriceAction();
          const result = await getGasPriceAction.func({
              network: "ETH_MAINNET" // Test with supported network
          });
          console.log("Test 5 Passed - Successfully queried supported network");
      } catch (error) {
          console.error("Test 5 Failed - Error querying supported network:", error);
      }
  
      // Test 6: Response Format
      try {
          getBlockAction = new GetBlockAction();
          const result = await getBlockAction.func({
              blockNumberOrTag: "latest",
              network: "ETH_MAINNET"
          });
          
          if (typeof result !== 'string' || !result.includes("Block Number")) {
              throw new Error("Invalid response format");
          }
          console.log("Test 6 Passed - Response format is correct");
      } catch (error) {
          console.error("Test 6 Failed - Invalid response format:", error);
      }
  }
  
    // Run all tests
export async function runAlchemyTests() {
    await testAlchemyActions();
}