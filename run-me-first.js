const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('./config.json');

console.log("Starting application");

const commands = [
	new SlashCommandBuilder().setName('setup').setDescription('Allows you to set the configuration for the application!').addStringOption(option =>
		option.setName('prefix')
			.setDescription('The prefix you would like to use.')
			.setRequired(true)).addStringOption(option => 
				option.setName('generateroleid')
					.setDescription('Please enter the role ID of those who should be allowed to generate keys.')
					.setRequired(true)).addStringOption(option => 
						option.setName('action')
							.setDescription('Please pick between the following option: giveRole, sendFile, and ownAction')
							.setRequired(true)).addStringOption(option => 
								option.setName('role')
									.setDescription('If you selected giveRole please select the correct role ID of that you would like to update them to.')
									.setRequired(true)).addStringOption(option => 
										option.setName('defaultrole')
											.setDescription('Please enter the  role ID of that you would like to update them to after their key expires.')
											.setRequired(true)).addStringOption(option => 
												option.setName('filename')
													.setDescription('If you selected sendFile please enter the name of the file in the "Discord Bot" directory')
													.setRequired(true)),
	new SlashCommandBuilder().setName('gen').setDescription('Allows you to generate key(s)').addStringOption(option =>
		option.setName('time')
			.setDescription('The length of time the keys should be for. (day/week/month/lifetime)')
			.setRequired(true)).addIntegerOption(option =>
                option.setName('amount')
                    .setDescription('The number of keys to generate.')
                    .setRequired(true)),
	new SlashCommandBuilder().setName('redeem').setDescription('Allows you to redeem key(s)').addStringOption(option => 
		option.setName('key')
			.setDescription('Your key (Only use keys YOU own)')
			.setRequired(true)),
]
	.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);