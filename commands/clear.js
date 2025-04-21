const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear a specified number of messages from the channel')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to clear (1-100)')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Clear messages from a specific user')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction, client) {
        const amount = interaction.options.getInteger('amount');
        const user = interaction.options.getUser('user');

        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({ 
                content: 'You do not have permission to use this command.', 
                flags: MessageFlags.Ephemeral 
            });
        }

        try {
            // Fetch messages
            const messages = await interaction.channel.messages.fetch({ limit: amount });
            
            // Filter messages by user if specified
            const messagesToDelete = user 
                ? messages.filter(msg => msg.author.id === user.id)
                : messages;

            if (messagesToDelete.size === 0) {
                return interaction.reply({ 
                    content: user 
                        ? `No messages found from ${user.tag} in the last ${amount} messages.`
                        : 'No messages found to delete.',
                    flags: MessageFlags.Ephemeral 
                });
            }

            // Delete the messages
            await interaction.channel.bulkDelete(messagesToDelete, true);

            // Send confirmation message
            const reply = await interaction.reply({ 
                content: `Successfully deleted ${messagesToDelete.size} message${messagesToDelete.size === 1 ? '' : 's'}${user ? ` from ${user.tag}` : ''}.`,
                flags: MessageFlags.Ephemeral 
            });

            // Delete the confirmation message after 5 seconds
            setTimeout(() => {
                reply.delete().catch(console.error);
            }, 5000);

        } catch (error) {
            console.error('Error clearing messages:', error);
            await interaction.reply({ 
                content: 'There was an error clearing messages. Make sure the messages are not older than 14 days.',
                flags: MessageFlags.Ephemeral 
            });
        }
    }
}; 