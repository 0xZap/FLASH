import { runPerplexityTests } from "./perplexity";
import { runBrowserUseTests } from "./browser_use";

export async function runWebdataTests() {
    await runPerplexityTests();
    await runBrowserUseTests();
}