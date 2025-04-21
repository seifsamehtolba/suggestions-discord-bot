const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const config = require('../config.json');
const db = require('../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Submit a suggestion for the server'),

    async execute(interaction, client) {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('category_select')
            .setPlaceholder('Select a category')
            .addOptions(
                Object.keys(config.categories).map(category => ({
                    label: category,
                    value: category
                }))
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.reply({ content: 'Please select a category for your suggestion:', components: [row], flags: MessageFlags.Ephemeral });

        const filter = i => i.customId === 'category_select' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            const category = i.values[0];
            const modal = new ModalBuilder()
                .setCustomId(`suggestion_modal_${category}`)
                .setTitle('Submit Your Suggestion');

            const suggestionInput = new TextInputBuilder()
                .setCustomId('suggestion_text')
                .setLabel('Your Suggestion')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(1000);

            const firstActionRow = new ActionRowBuilder().addComponents(suggestionInput);
            modal.addComponents(firstActionRow);

            await i.showModal(modal);

            const modalFilter = m => m.customId === `suggestion_modal_${category}` && m.user.id === interaction.user.id;
            try {
                const modalInteraction = await i.awaitModalSubmit({ filter: modalFilter, time: 60000 });
                const suggestion = modalInteraction.fields.getTextInputValue('suggestion_text');

                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('New Suggestion')
                    .setDescription(suggestion)
                    .addFields(
                        { name: 'Category', value: category },
                        { name: 'Author', value: interaction.user.toString() },
                        { name: 'Status', value: 'Pending' },
                        { name: 'Votes', value: '✅ 0 | ❌ 0' }
                    )
                    .setTimestamp();

                const channelId = config.categories[category];
                const channel = await interaction.guild.channels.fetch(channelId);
                const message = await channel.send({ embeds: [embed] });

                // Save suggestion to database
                const result = db.addSuggestion(
                    interaction.guild.id,
                    message.id,
                    channelId,
                    interaction.user.id,
                    category,
                    suggestion
                );

                // Create buttons with the actual message ID
                const upvoteButton = new ButtonBuilder()
                    .setCustomId(`upvote_${message.id}`)
                    .setLabel('Upvote')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅');

                const downvoteButton = new ButtonBuilder()
                    .setCustomId(`downvote_${message.id}`)
                    .setLabel('Downvote')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌');

                const buttonRow = new ActionRowBuilder().addComponents(upvoteButton, downvoteButton);

                // Edit the message to add buttons
                await message.edit({ components: [buttonRow] });

                await modalInteraction.reply({ content: 'Your suggestion has been submitted!', flags: MessageFlags.Ephemeral });
            } catch (error) {
                console.error('Error handling modal submission:', error);
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.followUp({ content: 'You did not select a category in time.', flags: MessageFlags.Ephemeral });
            }
        });
    }
}; 