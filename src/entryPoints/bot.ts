import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";

export function initBot(): void {
  const botToken = process.env.BOT_TOKEN ?? null;
  if (botToken === null) {
    throw new Error("No bot token provided");
  }
  const endpointUrl = process.env.RAG_ENDPOINT_URL ?? null;
  if (endpointUrl === null) {
    throw new Error("No RAG endpoint URL provided");
  }

  const bot = new Telegraf(botToken);
  bot.on("message", async (ctx) => {
    // @ts-ignore
    const text: string = ctx.message.text;
    const username = ctx.message.from.username;
    if (!text) {
      return;
    }
    await ctx.sendChatAction("typing");
    const res = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "user", content: `${username ?? "anonymous user"}: ${text}` },
        ],
      }),
    });
    const data = await res.text();

    const respText = data
      .split("\n")
      // 0:"something"
      .map((line) => line.substring(3, line.length - 1))
      .join("");

   await ctx.reply(respText);
  });
  bot.on(message("sticker"), (ctx) => ctx.reply("👍"));
  bot.launch();

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}
