import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

const startCommand = {
	data: new SlashCommandBuilder()
		.setName('start')
		.setDescription('Everybody loves Avalon :D'),
	async execute(interaction: ChatInputCommandInteraction) {
		await interaction.reply('Pong!');
	},
};

export default startCommand;
