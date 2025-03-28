
# Telegram Signals Bybit Bot by (email: king.xanda+Bb1@gmail.com) 🤖📈
```markdown

A Node.js bot that listens for trading signals from a Telegram channel and executes trades on Bybit automatically.

## Features ✨
- Parses Telegram signals in a structured format
- Executes trades on Bybit (spot/futures)
- Manages entry points, take-profit targets, and stop-loss
- Simple configuration setup

## Installation & Setup ⚙️

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/telegram-signals-bybit-bot.git
   cd telegram-signals-bybit-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the bot:

   - Rename `config - Copy.toml` to `config.toml`.
   - Edit the file with your credentials:
     ```toml
     TELEGRAM_BOT_TOKEN = "Telegram bot token here"
     apiKey = "Bybit Api Key here"
     apiSecret = "Bybit Secret Here"
     ```

4. Start the bot:
   ```bash
   node index.js
   ```

## Signal Format 📋
The bot recognizes signals in this format:
```
#AUCTIONUSDT | LONG
• Entry Zone: 26.16
• Targets: 26.29, 26.94, 27.73, 28.78
• Stop-Loss: 25.38
```

## Configuration Details 🔧
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token from @BotFather.
- `apiKey`: Your Bybit API key (ensure it has trading permissions).
- `apiSecret`: Your Bybit API secret.

⚠️ **Important Security Note**: Never share your `config.toml` file or commit it to GitHub!

## Support & Contact 📧
For questions, issues, or support, please contact:  
📩 king.xanda+Bb@gmail.com

## Disclaimer ⚠️
This bot is for educational purposes only. Use at your own risk. The developers are not responsible for any financial losses incurred while using this software. Always test with small amounts first.
```
