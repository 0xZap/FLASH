import * as dotenv from "dotenv";
dotenv.config();

function validateEnvironment(): void {
  const missingVars: string[] = [];
  const requiredVars = [
    "OPENAI_API_KEY",
    "HYPERBOLIC_API_KEY",
    "GOOGLE_API_KEY",
    "GOOGLE_CLIENT_SECRET",
    "ETHEREUM_PRIVATE_KEY",
    "EXA_API_KEY",
    "ALCHEMY_API_KEY",
    "COINGECKO_API_KEY",
  ];
  // Optional COINGECKO_PRO_API_KEY
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.error("Error: Required environment variables are not set");
    missingVars.forEach(varName => {
      console.error(`${varName}=your_${varName.toLowerCase()}_here`);
    });
    process.exit(1);
  }
}

validateEnvironment();

import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import * as readline from "readline";
import { ZapToolkit } from "@0xzap/flash-langchain";
import { ZapConfig, HyperbolicConfig, GoogleConfig, EthereumConfig, ExaConfig, AlchemyConfig, CoinGeckoConfig, PerplexityConfig, HeyGenConfig, ElevenLabsConfig, BrowserbaseConfig } from "@0xzap/flash";
// import { GoogleAuth, setupAuthServer } from './google_auth';

// Reset all existing instances
ZapConfig.resetInstance();
HyperbolicConfig.resetInstance();
GoogleConfig.resetInstance();
EthereumConfig.resetInstance();
ExaConfig.resetInstance();
AlchemyConfig.resetInstance();
PerplexityConfig.resetInstance();
HeyGenConfig.resetInstance();
ElevenLabsConfig.resetInstance();
BrowserbaseConfig.resetInstance();

// Initialize all configurations with environment variables
const zapConfig = ZapConfig.getInstance({
  hyperbolicApiKey: process.env.HYPERBOLIC_API_KEY
});

const hyperbolicConfig = HyperbolicConfig.getInstance({
  apiKey: process.env.HYPERBOLIC_API_KEY
});

const googleConfig = GoogleConfig.getInstance({
  token: process.env.GOOGLE_TOKEN
});

const ethereumConfig = EthereumConfig.getInstance({
  privateKey: process.env.ETHEREUM_PRIVATE_KEY
});

const exaConfig = ExaConfig.getInstance({
  apiKey: process.env.EXA_API_KEY
});

const alchemyConfig = AlchemyConfig.getInstance({
  apiKey: process.env.ALCHEMY_API_KEY
});

const coinGeckoConfig = CoinGeckoConfig.getInstance({
  apiKey: process.env.COINGECKO_API_KEY
});

const perplexityConfig = PerplexityConfig.getInstance({
  apiKey: process.env.PERPLEXITY_API_KEY
});

const heygenConfig = HeyGenConfig.getInstance({
  apiKey: process.env.HEYGEN_API_KEY
});

const elevenlabsConfig = ElevenLabsConfig.getInstance({
  apiKey: process.env.ELEVENLABS_API_KEY
});

const browserbaseConfig = BrowserbaseConfig.getInstance({
  apiKey: process.env.BROWSERBASE_API_KEY
});

/**
 * Initialize the agent with Zap Tools
 *
 * @returns Agent executor and config
 */
async function initializeAgent() {
  try {
    // Initialize LLM
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
    });

    // Get the Hyperbolic config instance
    const hyperbolicConfig = HyperbolicConfig.getInstance();

    // Initialize Zap Tools Toolkit with all configs
    const zapToolKit = new ZapToolkit(
      hyperbolicConfig,
      googleConfig,
      ethereumConfig,
      exaConfig,
      alchemyConfig,
      coinGeckoConfig,
      browserbaseConfig,
      elevenlabsConfig,     
      heygenConfig,
      perplexityConfig
    );
    const tools = zapToolKit.getTools();

    // Store buffered conversation history in memory
    const memory = new MemorySaver();
    const agentConfig = { configurable: { thread_id: "Zap Chatbot Example! - Inspired by CDP AgentKit Example" } };

    // Create React Agent using the LLM and Zap Tools
    const agent = createReactAgent({
      llm,
      tools,
      checkpointSaver: memory,
      messageModifier: `
        You are a helpful agent that can interact onchain using Zap Tools.
        `,
    });

    return { agent, config: agentConfig };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error; // Re-throw to be handled by caller
  }
}

/**
 * Run the agent interactively based on user input
 *
 * @param agent - The agent executor
 * @param config - Agent configuration
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runChatMode(agent: any, config: any) {
  console.log("Starting chat... Type 'exit' to end.");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise(resolve => rl.question(prompt, resolve));

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const userInput = await question("\nuser message: ");

      if (userInput.toLowerCase() === "exit") {
        break;
      }

      const stream = await agent.stream({ messages: [new HumanMessage(userInput)] }, config);

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          console.log(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
        }
        console.log("-------------------");
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

/**
 * Start the chatbot agent
 */
async function main() {
  try {
    // // Setup Google Auth
    // const authServer = setupAuthServer();
    
    // // Check for stored tokens
    // const storedTokens = await GoogleAuth.getStoredTokens();
    
    // if (!storedTokens) {
    //   // If no stored tokens, start OAuth flow
    //   const authUrl = GoogleAuth.init();
    //   console.log('Please visit this URL to authorize the application:', authUrl);
    //   console.log('Waiting for authentication...');
      
    //   // Wait for authentication to complete
    //   await new Promise(resolve => {
    //     const checkToken = setInterval(async () => {
    //       const tokens = await GoogleAuth.getStoredTokens();
    //       if (tokens) {
    //         clearInterval(checkToken);
    //         // Close the auth server after successful authentication
    //         authServer.close();
    //         resolve(tokens);
    //       }
    //     }, 1000);
    //   });
    // } else {
    //   // If we have stored tokens, we can close the auth server immediately
    //   authServer.close();
    // }

    // if (!storedTokens?.access_token) {
    //   throw new Error("Google API token not found");
    // }

    // Initialize GoogleConfig with the OAuth client
    GoogleConfig.resetInstance();
    const googleConfig = GoogleConfig.getInstance({
      token: process.env.GOOGLE_TOKEN || ""
    });

    const { agent, config } = await initializeAgent();
    await runChatMode(agent, config);
    
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  console.log("Starting Agent...");
  main().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
