
import { runExaTests } from "./exa";
import { runAlchemyTests } from "./alchemy";
import { runBrowserbaseTests } from "./browserbase";
import { runWebdataTests } from "./webdata";
import { runElevenLabsTests } from "./audio/elevenlabs";
import { runHeygenTests } from "./video";

runExaTests();
runAlchemyTests();
runBrowserbaseTests();
runWebdataTests();
runElevenLabsTests();
runHeygenTests();
console.log("All tests have been executed.");