import * as dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import ccxt from 'ccxt';

dotenv.config({ path: './config.toml' });

// config defaults
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'xxxx';

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const {apiKey, apiSecret} = process.env;
const bybitFutures = new ccxt.bybit({
    'apiKey': apiKey,
    'secret': apiSecret,
    'enableRateLimit': true,
    'options': {
        'defaultType': 'future',
    }
});


await bybitFutures.load_markets();

// // Fetch account balance from the exchange
let bybitBalanceInfo = await bybitFutures.fetchBalance();
console.log(bybitBalanceInfo);
let bybitBalance = bybitBalanceInfo.info.availableBalance;


bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    console.log(msg.text);

    const signal = isSinal(text);

    if(signal) {
        bot.sendMessage(chatId, JSON.stringify(signal, 2));
        // bot.sendMessage(chatId, JSON.stringify(bybitBalanceInfo.total.USDT));
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
            entryPattern: /entre:\s*([\d,.]+)\s*-\s*([\d,]+)/, // Matches "entre: 0,2580 - 0,2558"
            targetPattern: /TP:\s*([\d,]+(?:,\s*[\d,]+)*)/, // Matches "TP: 0,2598, 0,2652, 0,2706, 0,2760"
            stopLossPattern: /Stoploss:\s*([\d,]+)/ // Matches "Stoploss: 0,2421"
        },
        {
            entryPattern: /Buy Zone - \s*([\d,.]+)/,
            targetPattern: /1.\s*([\d,.]+)/,
            stopLossPattern: /Stop-Loss:\s*([\d,.]+)/
        },
        {
            entryPattern: /Entry\s*(?:above|below):\s*([\d,.]+)/, // Matches "Entry above: 0.1726" or "Entry below: 0.1726"
            targetPattern: /Targets:\s*\$([\d,.]+)/, // Matches "Targets: $0.1226"
            stopLossPattern: /Stop:\s*\$([\d,.]+)/ // Matches "Stop: $0.1926"
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
    return text.replace(",", ".").replace(/[^\d.]/g, "");
}

function extractSymbol(text) {
    const symbolMatch = text.match(/\b[\w/]*USDT\w*\b/); // Match any word containing "USDT"
    if (symbolMatch) {
        // Strip non-letter characters from the matched word
        return symbolMatch[0].replace(/[^a-zA-Z]/g, "");
    }
    return null; // Return null if no symbol is found
}


function extractEntryTargetStopLoss(text, entryPattern, targetPattern, stopLossPattern) {
    const entryMatch = text.match(entryPattern);
    const targetMatch = text.match(targetPattern);
    const stopLossMatch = text.match(stopLossPattern);
    const symbol = extractSymbol(text);

    if (symbol && entryMatch && targetMatch) {
        const entry = parseFloat(extractNumbers(entryMatch[1]));

        // Extract all targets from the captured line
        const targets = targetMatch[1]
            .split(",") // Split by commas
            .map(t => parseFloat(extractNumbers(t.trim()))) // Trim spaces and parse numbers
            .filter(t => !isNaN(t)); // Filter out NaN values

        const stopLoss = stopLossMatch ? parseFloat(extractNumbers(stopLossMatch[1])) : null;

        return {
            symbol,
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
