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

    const signal = isSinal(text);

    if(signal) {
        bot.sendMessage(chatId, JSON.stringify(signal, 2));
        console.log(signal);
    }

    bot.sendMessage(chatId, `Yo crowdi`);


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

// check text and extract entry and target
function isSinal(text) {
    // Define patterns for each scenario
    // note targetPattern currently only captures one in many cases. need fix
    const patterns = [
        {
            entryPattern: /Entry Zone:\s*([\d,.]+)/,
            targetPattern: /Targets:\s*([\d,.]+(?:,\s*[\d,.]+)*)/, // Capture the entire Targets line
            stopLossPattern: /Stop-Loss:\s*([\d,.]+)/
        },
        {
            entryPattern: /Entry price:\s*\$([\d,.]+)/,
            targetPattern: /Targets:\s*\$([\d,.]+(?:,\s*[\d,.]+)*)/, // Capture the entire Targets line
            stopLossPattern: /Stop-Loss:\s*([\d,.]+)/
        },
        {
            entryPattern: /Entry:\s*\$([\d,.]+)/,
            targetPattern: /Targets:\s*\$([\d,.]+(?:,\s*[\d,.]+)*)/, // Capture the entire Targets line
            stopLossPattern: /Stop-Loss:\s*([\d,.]+)/
        },
        {
            entryPattern: /Buy Zone - \s*([\d,.]+)/,
            targetPattern: /1.\s*([\d,.]+)/,
            stopLossPattern: /Stop-Loss:\s*([\d,.]+)/
        },
        {
            entryPattern: /Entry price:\s*\$([\d,.]+)/,
            targetPattern: /Target:\s*\$([\d,.]+)/, // New pattern for "Target:"
            stopLossPattern: /Stop:\s*\$([\d,.]+)/ // New pattern for "Stop:"
        }
    ];
    
    // Iterate through patterns and return the first valid match
    for (const pattern of patterns) {
        const result = extractEntryTargetStopLoss(text, pattern.entryPattern, pattern.targetPattern, pattern.stopLossPattern);
        if (result) {
            return result;
        }
    }

    // If no pattern matches, return default values
    // return {
    //     entry: null,
    //     target: [],
    //     stopLoss: null
    // };
    return false;
}

function extractNumbers(text) {
    return text.replace(",", "."); // Replace commas with periods for consistent parsing
}

function extractEntryTargetStopLoss(text, entryPattern, targetPattern, stopLossPattern) {
    const entryMatch = text.match(entryPattern);
    const targetMatch = text.match(targetPattern);
    const stopLossMatch = text.match(stopLossPattern);

    if (entryMatch && targetMatch) {
        const entry = parseFloat(extractNumbers(entryMatch[1]));

        // Extract all targets from the captured line
        const targets = targetMatch[1]
            .split(",") // Split by commas
            .map(t => parseFloat(extractNumbers(t.trim()))) // Trim spaces and parse numbers
            .filter(t => !isNaN(t)); // Filter out NaN values

        const stopLoss = stopLossMatch ? parseFloat(extractNumbers(stopLossMatch[1])) : null;

        return {
            entry,
            target: targets,
            stopLoss
        };
    }

    return null; // No match found for this pattern
}

// Add more patterns and logic as needed
function extractNumbersAndCompare(entryPrice, targetPrice) {
    return entryPrice > targetPrice ? 'above' : 'below';
}
