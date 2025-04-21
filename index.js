const { Client, GatewayIntentBits, Partials, Collection, MessageFlags, EmbedBuilder } = require('discord.js');
const fs = require('fs');
require('dotenv').config();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.commands = new Collection();
// Store vote counts and user votes
client.votes = new Map(); // { messageId: { upvotes: number, downvotes: number, userVotes: Map<userId, 'up'|'down'> } }

// Load commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const [action, messageId] = interaction.customId.split('_');
    
    try {
        // Find the message in any channel
        let message;
        for (const channel of interaction.guild.channels.cache.values()) {
            if (channel.isTextBased()) {
                try {
                    message = await channel.messages.fetch(messageId);
                    if (message) break;
                } catch (error) {
                    // Message not found in this channel, continue searching
                    continue;
                }
            }
        }

        if (!message) {
            return await interaction.reply({ content: 'Could not find the suggestion message.', flags: MessageFlags.Ephemeral });
        }

        const oldEmbed = message.embeds[0];
        if (!oldEmbed) {
            return await interaction.reply({ content: 'This message does not contain a suggestion embed.', flags: MessageFlags.Ephemeral });
        }

        // Initialize vote tracking for this message if it doesn't exist
        if (!client.votes.has(messageId)) {
            client.votes.set(messageId, {
                upvotes: 0,
                downvotes: 0,
                userVotes: new Map() // Track individual user votes
            });
        }

        const voteData = client.votes.get(messageId);
        const userId = interaction.user.id;

        // Check if user has already voted
        const currentVote = voteData.userVotes.get(userId);

        // Handle vote changes
        if (action === 'upvote') {
            if (currentVote === 'up') {
                // User is removing their upvote
                voteData.upvotes--;
                voteData.userVotes.delete(userId);
            } else {
                // If user had a downvote, remove it first
                if (currentVote === 'down') {
                    voteData.downvotes--;
                }
                // Add new upvote
                voteData.upvotes++;
                voteData.userVotes.set(userId, 'up');
            }
        } else if (action === 'downvote') {
            if (currentVote === 'down') {
                // User is removing their downvote
                voteData.downvotes--;
                voteData.userVotes.delete(userId);
            } else {
                // If user had an upvote, remove it first
                if (currentVote === 'up') {
                    voteData.upvotes--;
                }
                // Add new downvote
                voteData.downvotes++;
                voteData.userVotes.set(userId, 'down');
            }
        }

        // Create a new embed with updated fields
        const newEmbed = new EmbedBuilder()
            .setColor(oldEmbed.color)
            .setTitle(oldEmbed.title)
            .setDescription(oldEmbed.description);

        // Add all fields except Votes
        for (const field of oldEmbed.fields) {
            if (field.name !== 'Votes') {
                newEmbed.addFields(field);
            }
        }

        // Add the updated Votes field
        newEmbed.addFields({ name: 'Votes', value: `✅ ${voteData.upvotes} | ❌ ${voteData.downvotes}` })
            .setTimestamp();

        await message.edit({ embeds: [newEmbed] });
        
        // Send appropriate response based on vote action
        if (currentVote === (action === 'upvote' ? 'up' : 'down')) {
            await interaction.reply({ content: 'Your vote has been removed!', flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content: 'Your vote has been recorded!', flags: MessageFlags.Ephemeral });
        }
    } catch (error) {
        console.error('Error handling button interaction:', error);
        await interaction.reply({ content: 'There was an error processing your vote.', flags: MessageFlags.Ephemeral });
    }
});

client.login(process.env.DISCORD_TOKEN); 