import * as dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import ccxt from 'ccxt';
import WebSocket from 'ws';


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


bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    console.log(msg.text);

    const signal = isSinal(text);
    let amount = 10;

    try {
        if(signal) {
            bot.sendMessage(chatId, JSON.stringify(signal, 2));
            // bot.sendMessage(chatId, JSON.stringify(bybitBalanceInfo.total.USDT));
            console.log(signal);
    
            let topCoinInfo = { symbol: signal.symbol.toUpperCase(), price: null, precision: null };
            topCoinInfo.precision = bybitFutures.markets[topCoinInfo.symbol.replace("USDT", "/USDT:USDT")].precision.amount;
    
            topCoinInfo.price = await fetchWebsocketPriceBybit(topCoinInfo.symbol);
    
            let futuresSymbol = topCoinInfo.symbol.replace("USDT", "/USDT:USDT");
    
            signal.side = 'long';
            let leverage = 25;
            let positionSide = 'long';
    
    
            // await bybitFutures.cancelAllOrders(topCoinInfo.symbol);
    
            // let setleverage = await bybitFutures.fapiPrivate_post_leverage({ 'symbol': futuresSymbol, 'leverage': leverage })
    
            let tradeSize = null;
    
            tradeSize = ((amount / topCoinInfo.price) * leverage).toFixed(topCoinInfo.precision);
    
            const side = (signal.entry > signal.stopLoss) ? 'buy' : 'sell';       // edit here
    
            const InverseSide = (positionSide == 'long') ? 'sell' : 'buy';       // edit here
    
            console.log(signal, tradeSize, topCoinInfo);
    
            let order = {};
    
            let orderExec = false;
    
            // create differnt same price limit orders to tp at diff levels
            for(let i = 0; i < signal.target.length; i++) {
                let orderSize = (tradeSize / signal.target.length).toFixed(topCoinInfo.precision);
                while (true) {
                    orderExec = await tryToCreateOrder(bybitFutures, futuresSymbol, 'limit', side, orderSize, signal.entry, {stopLoss : signal.stopLoss, takeProfit : signal.target[i], basePrice : topCoinInfo.price});
                    if (orderExec !== false) {
                        order = orderExec;
                        break;
                    }
                }
            }
    
    
    
            // Optional Stop Loss manual
            // let slOrder = {};
            // if (sl && sl !== '0' && strategyType == 'manual') {
            //     let slOrderExec = false;
            //     while (true) {
            //         slOrderExec = await tryToCreateOrder(bybitFutures, futuresSymbol, 'STOP_MARKET', InverseSide, tradeSize, null, { stopPrice: sl, "reduceOnly": 'true' });
            //         if (slOrderExec !== false) {
            //             slOrder = slOrderExec;
            //             break;
            //         }
            //     }
            // }
    
    
            // // Optional Take Profit manual
            // let tpOrder = {};
            // if (tp && tp !== '0' && strategyType == 'manual') {
            //     let tpOrderExec = false;
            //     while (true) {
            //         tpOrderExec = await tryToCreateOrder(bybitFutures, futuresSymbol, 'TAKE_PROFIT_MARKET', InverseSide, tradeSize, null, { stopPrice: tp, "reduceOnly": 'true' });
            //         if (tpOrderExec !== false) {
            //             tpOrder = tpOrderExec;
            //             break;
            //         }
            //     }
            // }
        }
    
        bot.sendMessage(chatId, `Yo crowdi`);
    
    
    } catch(e) {
        bot.sendMessage(chatId, JSON.stringify({ error : `error: Please try again ${e}`}));

    }


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
            targetPattern: /Targets:\s*([^\n]*)/, // Capture the entire Targets line
            stopLossPattern: /Stop-Loss:\s*([\d,.]+)/
        },
		{
            entryPattern: /Enter:\s*([\d,.]+)/,
            targetPattern: /Targets:\s*([^\n]*)/, // Capture the entire Targets line
            stopLossPattern: /Stop-Loss:\s*([\d,.]+)/
        },
        {
            entryPattern: /Entry price:\s*\$([\d,.]+)/,
            targetPattern: /Targets:\s*([^\n]*)/, // Capture the entire Targets line
            stopLossPattern: /Stop-Loss:\s*([\d,.]+)/
        },
        {
            entryPattern: /Entry:\s*\$([\d,.]+)/,
            targetPattern: /Targets:\s*\$([^\n]*)/, // Capture the entire Targets line
            stopLossPattern: /Stop-Loss:\s*([\d,.]+)/
        },
        {
            entryPattern: /Entry:\s*([\d.]+)/,
            targetPattern: /TP\d+:\s*([^\n]*)/g,
            stopLossPattern: /SL:\s*([\d.]+)/
        },
        {
            entryPattern: /Entry price:\s*$([\d.]+)/,
            targetPattern: /Target:\s*([^\n]*)/g,
            stopLossPattern: /Stop:\s*([\d.]+)/
        },
        {
            entryPattern: /entre:\s*([\d,.]+)\s*-\s*([\d,]+)/, // Matches "entre: 0,2580 - 0,2558"
            targetPattern: /TP:\s*([^\n]*)/, // Matches "TP: 0,2598, 0,2652, 0,2706, 0,2760"
            stopLossPattern: /Stoploss:\s*([\d,]+)/ // Matches "Stoploss: 0,2421"
        },
        {
            entryPattern: /Buy Zone - \s*([\d,.]+)/,
            targetPattern: /1.\s*([^\n]*)/,
            stopLossPattern: /Stop-Loss:\s*([\d,.]+)/
        },
        {
            entryPattern: /Entry\s*(?:above|below):\s*([\d,.]+)/, // Matches "Entry above: 0.1726" or "Entry below: 0.1726"
            targetPattern: /Targets:\s*\$([^\n]*)/, // Matches "Targets: $0.1226"
            stopLossPattern: /Stop:\s*\$([\d,.]+)/ // Matches "Stop: $0.1926"
        },
        {
            entryPattern: /Entry price:\s*\$([\d,.]+)/,
            targetPattern: /Target:\s*\$([^\n]*)/, // New pattern for "Target:"
            stopLossPattern: /Stop:\s*\$([\d,.]+)/ // New pattern for "Stop:"
        }, 
		{
		  entryPattern: /Entering:\s*([\d,.]+)/,
		  targetPattern: /Takeprofit:\s*\$([\d,.]+)/,
		  stopLossPattern: /Stop:\s*\$([\d,.]+)/
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
    try {
        const symbolMatch = text.match(/\b[\w/]*USDT\w*\b/); // Match any word containing "USDT"
        if (symbolMatch) {
            // Strip non-letter characters from the matched word
            return symbolMatch[0].replace(/[^a-zA-Z]/g, "");
        }
        return null; // Return null if no symbol is found
    
    } catch(e) {
        console.log(e)
        return null;
    }
}


function extractEntryTargetStopLoss(text, entryPattern, targetPattern, stopLossPattern) {
    try {
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
    
    } catch(e) {
        console.log(e);
        return null;
    }
}

// Add more patterns and logic as needed
function extractNumbersAndCompare(entryPrice, targetPrice) {
    return entryPrice > targetPrice ? 'above' : 'below';
}


async function fetchWebsocketPriceBybit(symbol) {
    let ticker = symbol.toUpperCase();
    let tickerPrice = null;

    // Bybit WebSocket URL for mark price streams
    const wsUrl = `wss://stream.bybit.com/v5/public/linear`;

    // Create WebSocket connection
    let ws = new WebSocket(wsUrl);

    ws.on('open', function open() {
        console.log('WebSocket connection opened');
        // Subscribe to the mark price stream for the given symbol
        ws.send(JSON.stringify({
            "op": "subscribe",
            "args": [`tickers.${ticker}`]
        }));
    });

    ws.on('message', function message(data) {
        // console.log('received: %s', data);
        data = JSON.parse(data);

        // Check if the message contains mark price data
        if (data.topic && data?.data?.markPrice) {
            tickerPrice = data.data.markPrice;
            console.log(`websocket price for ${symbol}:`, tickerPrice);
        }
    });

    ws.on('ping', (e) => { // Listen for ping event
        ws.pong(); // Send pong frame
    });

    ws.on('close', function close() {
        console.log('WebSocket connection closed');
    });

    ws.on('error', function error(err) {
        console.error('WebSocket error:', err);
    });

    // Wait for the price to be received
    while (!tickerPrice) {
        console.log(`waiting on websocket price for ${symbol}...`, tickerPrice);
        await pause(500);
    }

    console.log(`websocket price for ${symbol}:`, tickerPrice);
    ws.close();
    return tickerPrice;
}

// Utility function to pause execution
function pause(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// (async () => {
//     const symbol = 'BTCUSDT';
//     const price = await fetchWebsocketPriceBybit(symbol);
//     console.log(`Mark price for ${symbol}:`, price);
// })();

//ccxt crate order
const tryToCreateOrder = async function (exchange, symbol, type, side, amount, price, params) {

    try {

        const order = await exchange.createOrder(symbol, type, side, amount, price, params)
        return order

    } catch (e) {

        console.log(e.constructor.name, e.message)

        if (e instanceof ccxt.NetworkError) {

            // retry on networking errors
            return false

        } else {

            throw e // break on all other exceptions
        }
    }
}
