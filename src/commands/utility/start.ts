import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
  TextChannel,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
  MessageFlags,
} from "discord.js";
import {
  avalonCharacters,
  numPlayersToRoles,
  AVALON_CHARACTERS,
} from "../../avalon";
import { POLL_TIME_MS } from "../../env";
import { generateRandomEmojis } from "../../utils";

const startCommand = {
  data: new SlashCommandBuilder()
    .setName("start")
    .setDescription("Everybody loves Avalon :D"),
  async execute(interaction: ChatInputCommandInteraction) {
    // first fetch all the users in the server
    // then depending on the number of users, randomize the list of users and roles
    // and then send each of them their individual dms

    if (!interaction.channel) {
      return; // the interaction is not in a guild
    }

    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Setting up the Avalon game. Please wait...",
    });

    // start a poll, everybody who reacts to the poll plays the game (fixes the server owner viewing problem)
    const textChannel = (await interaction.channel.fetch()) as TextChannel;

    const teamEmojis = generateRandomEmojis(3);

    const joinButton = new ButtonBuilder()
      .setCustomId("join_avalon")
      .setLabel("Join Avalon 🎲")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(joinButton);

    const pollMsg = await textChannel.send({
      // flags: MessageFlags.IsComponentsV2,
      content: `Click the button below to join the Avalon game! You have ${
        POLL_TIME_MS / 1000
      } seconds to join. ${teamEmojis}`,
      components: [row.toJSON()],
    });

    const collector = pollMsg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: POLL_TIME_MS,
    });

    const joinedUsers = new Map<string, GuildMember>();

    collector.on("collect", async (interaction) => {
      if (!interaction.isButton()) return;
      if (interaction.customId === "join_avalon") {
        const member = await interaction.guild?.members.fetch(
          interaction.user.id
        );
        if (member && !joinedUsers.has(member.id)) {
          joinedUsers.set(member.id, member);
          await interaction.reply({
            content: "You've joined the game!",
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await interaction.reply({
            content: "You're already in the game!",
            flags: MessageFlags.Ephemeral,
          });
        }
      }
    });

    await new Promise((resolve) => collector.on("end", resolve));

    const members = Array.from(joinedUsers.values());
    const num = members.length;

    if (num < 5) {
      await textChannel.send("Not enough players to start a game of Avalon!");
      return;
    }

    const roles = numPlayersToRoles[num as 5 | 6 | 7 | 8 | 9 | 10 | 11];

    await textChannel.send(
      `Starting a game of Avalon with ${num} players!\n Roles are: ${roles.join(
        ", "
      )}`
    );

    const shuffledRoles = roles.sort(() => Math.random() - 0.5);
    const shuffledMembers = members.sort(() => Math.random() - 0.5);
    if (shuffledRoles.length !== shuffledMembers.length) {
      await textChannel.send("Shuffled roles and members do not match!");
      return;
    }

    const roleMemberMap = new Map<AVALON_CHARACTERS, GuildMember[]>();
    for (let i = 0; i < num; i++) {
      const member = shuffledMembers.at(i);
      if (!member) {
        await textChannel.send("Member not found!");
        return;
      }
      roleMemberMap.set(shuffledRoles[i], [
        ...(roleMemberMap.get(shuffledRoles[i]) || []),
        member,
      ]);
    }

    const prettyRoleMemberMap = [...roleMemberMap.entries()]
      .map(([role, members]) => {
        return `${role}: ${members
          .map((member) => member.user.displayName)
          .join(", ")}`;
      })
      .join("\n");

    console.log(
      `Playing Avalon with ${num} people, and roles: \n${prettyRoleMemberMap}`
    );

    for (const [role, members] of roleMemberMap) {
      for (const member of members) {
        let message = "";
        const dmChannel = await member.createDM(true);
        try {
          message += `You are ${role} (${avalonCharacters[role].allegiance})`;
          await dmChannel.send(`You are ${role}`);
        } catch (e) {
          console.error(`Failed to send DM to ${member.user.displayName}`);
          await textChannel.send(
            `Failed to send DM to ${member.user.displayName}`
          );
        }
        const sees = avalonCharacters[role].sees
          .map((seenCharacter) => {
            const members = roleMemberMap.get(seenCharacter);
            if (!members) {
              return null;
            }
            return members.map((member) => member.user.username);
          })
          .filter(Boolean)
          .flat()
          .join(", ");
        if (sees) {
          message += `\nYou see: ${sees}`;
        }
        await dmChannel.send(message);
      }
    }
    await textChannel.send({
      content: "Game started! Check your DMs for your role!",
    });
  },
};

export default startCommand;
