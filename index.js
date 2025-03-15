import * as dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
dotenv.config({ path: './config.toml' });

// config defaults
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'xxxx';

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    console.log(msg.text);

    // Check if the message matches your criteria
    // const entryMatch = text.match(/ENTRÉ:\s*([\d,.]+)/);
    // const targetMatch = text.match(/MÅL 1:\s*([\d,.]+)/);

    // if (entryMatch && targetMatch) {
    //     const entryPrice = parseFloat(entryMatch[1].replace(',', '.'));
    //     const targetPrice = parseFloat(targetMatch[1].replace(',', '.'));
    //     const comparison = entryPrice > targetPrice ? 'above' : 'below';
    //     bot.sendMessage(chatId, `Entry ${comparison}: ${entryPrice}`);
    // }
});



// Add more patterns and logic as needed
function extractNumbersAndCompare(entryPrice, targetPrice) {
    return entryPrice > targetPrice ? 'above' : 'below';
}
