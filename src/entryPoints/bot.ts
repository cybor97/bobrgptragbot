import { Context, Telegraf } from "telegraf";

const mentions = ["bobr", "bóbr", "бобр"];

async function handleMessage(ctx: Context): Promise<void> {
  if (!ctx.message || !ctx.chat) {
    return;
  }
  const endpointUrl = process.env.RAG_ENDPOINT_URL ?? null;
  if (endpointUrl === null) {
    throw new Error("No RAG endpoint URL provided");
  }

  // @ts-ignore
  const text: string = ctx.message.text;
  if (!text) {
    return;
  }

  if (
    ctx.chat.id !== ctx.message.from.id &&
    !mentions.some((mention) => text.toLowerCase().startsWith(mention)) &&
    !text.includes(ctx.botInfo.username)
  ) {
    return;
  }

  // @ts-ignore
  const username: string = ctx.message.from.username;
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

  await ctx.reply(respText.replace(/\\n/g, "\n"));
}

export function initBot(): void {
  const botToken = process.env.BOT_TOKEN ?? null;
  if (botToken === null) {
    throw new Error("No bot token provided");
  }

  const bot = new Telegraf(botToken);
  bot.on("message", handleMessage);
  bot.mention("@bobrraggpt_bot", handleMessage);
  bot.textMention("Bobr GPT", handleMessage);
  bot.launch();

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}
