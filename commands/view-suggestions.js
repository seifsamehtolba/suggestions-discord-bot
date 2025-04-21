const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('view-suggestions')
        .setDescription('View suggestions for your server')
        .addStringOption(option =>
            option.setName('status')
                .setDescription('Filter suggestions by status')
                .addChoices(
                    { name: 'All', value: 'all' },
                    { name: 'Pending', value: 'pending' },
                    { name: 'Accepted', value: 'accepted' },
                    { name: 'Denied', value: 'denied' }
                )
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Page number')
                .setMinValue(1)
                .setRequired(false)),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
        }

        const status = interaction.options.getString('status');
        const page = interaction.options.getInteger('page') || 1;
        const itemsPerPage = 5;
        const offset = (page - 1) * itemsPerPage;

        try {
            // Get suggestion stats
            const stats = db.getSuggestionStats(interaction.guild.id);
            
            // Get suggestions based on status
            const suggestions = status === 'all' 
                ? db.getGuildSuggestions(interaction.guild.id)
                : db.getGuildSuggestions(interaction.guild.id, status);

            const totalPages = Math.ceil(suggestions.length / itemsPerPage);
            const pageSuggestions = suggestions.slice(offset, offset + itemsPerPage);

            if (suggestions.length === 0) {
                return interaction.reply({ 
                    content: `No ${status === 'all' ? '' : status} suggestions found for this server.`, 
                    flags: MessageFlags.Ephemeral 
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`Server Suggestions (${status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)})`)
                .setDescription(`Page ${page} of ${totalPages}`)
                .addFields(
                    { name: 'Total Suggestions', value: stats.total.toString(), inline: true },
                    { name: 'Pending', value: stats.pending.toString(), inline: true },
                    { name: 'Accepted', value: stats.accepted.toString(), inline: true },
                    { name: 'Denied', value: stats.denied.toString(), inline: true }
                );

            for (const suggestion of pageSuggestions) {
                const statusEmoji = {
                    'pending': '⏳',
                    'accepted': '✅',
                    'denied': '❌'
                }[suggestion.status];

                embed.addFields({
                    name: `Suggestion #${suggestion.id} ${statusEmoji}`,
                    value: `**Category:** ${suggestion.category}\n` +
                           `**Content:** ${suggestion.content}\n` +
                           `**Author:** <@${suggestion.author_id}>\n` +
                           `**Votes:** ✅ ${suggestion.upvotes} | ❌ ${suggestion.downvotes}\n` +
                           `**Created:** <t:${Math.floor(new Date(suggestion.created_at).getTime() / 1000)}:R>`
                });
            }

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('Error viewing suggestions:', error);
            await interaction.reply({ content: 'There was an error viewing suggestions.', flags: MessageFlags.Ephemeral });
        }
    }
}; 