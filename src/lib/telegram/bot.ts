import { Telegraf } from "telegraf";

let botInstance: Telegraf | null = null;

export function getBot(): Telegraf {
  if (!botInstance) {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN manquant dans .env");
    }
    botInstance = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
  }
  return botInstance;
}
