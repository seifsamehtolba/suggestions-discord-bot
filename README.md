# Discord Suggestions Bot
[Watch on YouTube](https://www.youtube.com/watch?v=C4GVfLJP8Fs)
A feature-rich Discord bot that implements a complete suggestion system with categories, voting, and admin controls. Perfect for community-driven servers looking to gather and manage user suggestions effectively.

## ✨ Features

- **Category-based Suggestions**
  - Submit suggestions with category selection
  - Dedicated channels for each category
  - Organized suggestion management

- **Interactive Voting System**
  - Real-time voting with ✅ and ❌ reactions
  - Persistent vote tracking
  - Clear visual feedback

- **Admin Controls**
  - Accept/deny suggestions with custom responses
  - Category management
  - Moderation tools

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configuration**
   - Copy `.env.example` to `.env`
   - Add your Discord bot token to `.env`
   - Update `config.json` with your category names and channel IDs

3. **Deploy Commands**
   ```bash
   npm run deploy
   ```

4. **Start the Bot**
   ```bash
   npm start
   ```

## ⚙️ Configuration

Edit `config.json` to customize your suggestion categories and channels:

```json
{
  "categories": {
    "Bug Reports": "channel_id_here",
    "Feature Requests": "channel_id_here",
    "General Chat": "channel_id_here",
    "Event Ideas": "channel_id_here",
    "Server Improvements": "channel_id_here"
  }
}
```

## 📋 Commands

### User Commands
- `/suggest` - Submit a new suggestion with category selection
- `/view-suggestions` - View all suggestions in a category

### Admin Commands
- `/accept-suggestion <messageId>` - Accept a suggestion
- `/deny-suggestion <messageId>` - Deny a suggestion
- `/clear` - Clear suggestions from a channel

## 🔧 Environment Variables

Create a `.env` file with the following variables:
```
DISCORD_TOKEN=your_bot_token_here
```

## 📋 Requirements

- Node.js 16.9.0 or higher
- Discord.js v14
- Administrator permissions in your Discord server

## 🛠️ Dependencies

- discord.js ^14.14.1
- better-sqlite3 ^11.9.1
- sqlite3 ^5.1.7
- dotenv ^16.4.1

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, please open an issue in the GitHub repository or contact the maintainers. 
