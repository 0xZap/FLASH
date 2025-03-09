import { runExaTests } from "./exa";
import { runAlchemyTests } from "./alchemy";
import { runBrowserbaseTests } from "./browserbase";

console.log("All tests have been executed.");

runExaTests();
runAlchemyTests();
runBrowserbaseTests();