const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deny-suggestion')
        .setDescription('Deny a suggestion')
        .addStringOption(option =>
            option.setName('messageid')
                .setDescription('The message ID of the suggestion')
                .setRequired(true)),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
        }

        const messageId = interaction.options.getString('messageid');
        
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
                return interaction.reply({ content: 'Could not find the suggestion message.', flags: MessageFlags.Ephemeral });
            }

            const oldEmbed = message.embeds[0];
            if (!oldEmbed) {
                return interaction.reply({ content: 'This message does not contain a suggestion embed.', flags: MessageFlags.Ephemeral });
            }

            // Update suggestion status in database
            db.updateSuggestionStatus(messageId, 'denied');

            const newEmbed = EmbedBuilder.from(oldEmbed)
                .setColor('#ff0000')
                .setFields(
                    ...oldEmbed.fields.filter(field => field.name !== 'Status'),
                    { name: 'Status', value: '❌ Denied' }
                );

            await message.edit({ embeds: [newEmbed] });
            await interaction.reply({ content: 'Suggestion has been denied!', flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('Error denying suggestion:', error);
            await interaction.reply({ content: 'There was an error denying the suggestion.', flags: MessageFlags.Ephemeral });
        }
    }
}; 