import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder, TextChannel } from "discord.js";
import { avalonCharacters, numPlayersToRoles, AVALON_CHARACTERS } from "../../avalon";

const startCommand = {
	data: new SlashCommandBuilder()
		.setName('start')
		.setDescription('Everybody loves Avalon :D'),
	async execute(interaction: ChatInputCommandInteraction) {
		// first fetch all the users in the server
    // then depending on the number of users, randomize the list of users and roles
    // and then send each of them their individual dms 

    if (!interaction.channel) {
      return; // the interaction is not in a guild
    }

    const textChannel = await interaction.channel.fetch() as TextChannel;

    const fetchedMembers = await textChannel.guild.members.fetch();
    
    const members = fetchedMembers.filter(member => !member.user.bot && textChannel.permissionsFor(member).has("ViewChannel"));

    const num = members.size;

    if (num < 5 || num > 10) {
      await interaction.reply('Not enough players to start a game of Avalon!');
      return;
    }

    const roles = numPlayersToRoles[num as 5 | 6 | 7 | 8 | 9 | 10];

    const shuffledRoles = roles.sort(() => Math.random() - 0.5);
    const shuffledMembers = members.sort(() => Math.random() - 0.5);
    if (shuffledRoles.length !== shuffledMembers.size) {
      await interaction.reply('Shuffled roles and members do not match!');
      return;
    }

    const roleMemberMap = new Map<AVALON_CHARACTERS, GuildMember[]>();
    for (let i = 0; i < num; i++) {
      const member = shuffledMembers.at(i);
      if (!member) {
        await interaction.reply('Member not found!');
        return;
      }
      roleMemberMap.set(shuffledRoles[i], [...(roleMemberMap.get(shuffledRoles[i]) || []), member]);
    }
    console.log(roleMemberMap);

    for (const [role, members] of roleMemberMap) {
      for (const member of members) {
        const dmChannel = await member.createDM(true);
        await dmChannel.send(`You are ${role}`);
        const sees = avalonCharacters[role].sees.map(seenCharacter => {
          const members = roleMemberMap.get(seenCharacter);
          if (!members) {
            return null;
          }
          return members.map(member => member.user.username);
        })
        .filter(Boolean)
        .flat()
        .join(', ');
        if (sees) {
          await dmChannel.send(`You see: ${sees}`);
        }
      }
    }
  },
};

export default startCommand;
