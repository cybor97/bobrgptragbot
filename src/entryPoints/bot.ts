import { Context, Telegraf } from "telegraf";
import { Message } from "telegraf/typings/core/types/typegram";

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

  // @ts-ignore
  const replyTo: Message | null = ctx.message.reply_to_message ?? null;
  if (
    ctx.chat.id !== ctx.message.from.id &&
    !mentions.some((mention) => text.toLowerCase().startsWith(mention)) &&
    !text.includes(ctx.botInfo.username) &&
    !(replyTo && replyTo.from?.id === ctx.botInfo.id)
  ) {
    return;
  }

  if (!text) {
    return;
  }

  const messages = [{ role: "user", content: text }];
  // @ts-ignore
  const replyText = replyTo?.text ?? null;
  if (replyText) {
    messages.unshift({ role: "assistant", content: replyText });
  }

  await ctx.sendChatAction("typing");
  const res = await fetch(endpointUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: process.env.RAG_AUTH_TOKEN!,
    },
    body: JSON.stringify({ messages, data: { userId: ctx.message.from.id } }),
  });
  const data = await res.text();

  const respText = data
    .split("\n")
    // 0:"something"
    .map((line) => line.substring(3, line.length - 1))
    .join("")
    .replace(/\\n/g, "\n")
    .replace('\\"/g', '"');

  await ctx.reply(respText);
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
