import { Events, GatewayIntentBits, MessageFlags } from 'discord.js';
import dotenv from 'dotenv';
import AvalonClient from './client';
import { readEnv } from './env';

// Load environment variables from .env file
dotenv.config();

// Create a new Discord client instance
const client = new AvalonClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
});

// Bot logs when it's ready
client.once('ready', () => {
    console.log(`${client.user?.username} is online!`);
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

  const command = (interaction.client as AvalonClient).commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		}
	}
});

// Login to Discord with your app's token
client.login(readEnv('DISCORD_TOKEN'));