import { runExaTests } from "./exa";
import { runAlchemyTests } from "./alchemy";
import { runBrowserbaseTests } from "./browserbase";
import * from "./code";
import * from "./code";
import * from "./webdata";
import * from "./audio";
import * from "./video";

console.log("All tests have been executed.");

runExaTests();
runAlchemyTests();
runBrowserbaseTests();