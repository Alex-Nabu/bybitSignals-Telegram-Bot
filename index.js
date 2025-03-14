const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

function extractNumbersAndCompare(entryPrice, targetPrice) {
    return entryPrice > targetPrice ? 'above' : 'below';
}

bot.onText(/ENTRÉ:\s*([\d,.]+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const entryPrice = parseFloat(match[1].replace(',', '.'));
    const targetMatch = msg.text.match(/MÅL 1:\s*([\d,.]+)/);

    if (targetMatch) {
        const targetPrice = parseFloat(targetMatch[1].replace(',', '.'));
        const comparison = extractNumbersAndCompare(entryPrice, targetPrice);
        bot.sendMessage(chatId, `Entry ${comparison}: ${entryPrice}`);
    }
});

// Add more patterns and logic as needed