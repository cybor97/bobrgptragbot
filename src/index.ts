import { config } from "dotenv";
import { initBot } from "./entryPoints/bot";

config();

async function main() {
  initBot();
}

main();
