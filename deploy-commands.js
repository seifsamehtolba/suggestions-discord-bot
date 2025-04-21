const { REST, Routes } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

console.log('Found command files:', commandFiles);

for (const file of commandFiles) {
    try {
        const command = require(`./commands/${file}`);
        console.log(`Loading command from ${file}:`, command.data.name);
        commands.push(command.data.toJSON());
    } catch (error) {
        console.error(`Error loading command from ${file}:`, error);
    }
}

console.log('Commands to be registered:', commands.map(cmd => cmd.name));

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands:');
        data.forEach(cmd => {
            console.log(`- ${cmd.name}`);
        });
    } catch (error) {
        console.error('Error deploying commands:', error);
    }
})(); 