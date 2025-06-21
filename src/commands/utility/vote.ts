import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  GuildMember,
  MessageFlags,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { POLL_TIME_MS } from "../../env";

const voteCommand = {
  data: new SlashCommandBuilder().setName("vote").setDescription("Start vote"),
  async execute(interaction: ChatInputCommandInteraction) {
    // 1. start a vote
    // 2. 30s for people to join the party
    // 3. 30s for people in the party to make a decision
    // 4. quest has failed/passed
    if (!interaction.channel) {
      return;
    }

    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Setting up the Avalon game. Please wait...",
    });

    const textChannel = (await interaction.channel.fetch()) as TextChannel;

    const joinButton = new ButtonBuilder()
      .setCustomId("join_vote")
      .setLabel("Join Vote 🙌")
      .setStyle(ButtonStyle.Primary);

    const leaveButton = new ButtonBuilder()
      .setCustomId("leave_vote")
      .setLabel("Leave Vote 😒")
      .setStyle(ButtonStyle.Primary);

    const joinRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      joinButton,
      leaveButton
    );

    const joinMsg = await textChannel.send({
      content: `Click the button below to join the vote! You have ${
        POLL_TIME_MS / 1000
      } seconds to join.`,
      components: [joinRow.toJSON()],
    });

    const joinMsgCollector = joinMsg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: POLL_TIME_MS,
    });

    const joinedUsers = new Map<string, GuildMember>();

    joinMsgCollector.on("collect", async (interaction) => {
      if (!interaction.isButton()) return;
      const member = await interaction.guild?.members.fetch(
        interaction.user.id
      );
      if (interaction.customId === "join_vote") {
        if (member && !joinedUsers.has(member.id)) {
          joinedUsers.set(member.id, member);
          await interaction.reply({
            content: "You've joined the party!",
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await interaction.reply({
            content: "You're already in the party!",
            flags: MessageFlags.Ephemeral,
          });
        }
      } else if (interaction.customId === "leave_vote") {
        if (member && joinedUsers.has(member.id)) {
          joinedUsers.delete(member.id);
          await interaction.reply({
            content: "You've left the party!",
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await interaction.reply({
            content: "You're not in the party!",
            flags: MessageFlags.Ephemeral,
          });
        }
      }
    });

    await new Promise((resolve) => joinMsgCollector.on("end", resolve));

    // send a notice to the main channel that voting has started
    const guildMembers = Array.from(joinedUsers.values());
    const partyNames: string[] = [];
    for (const guildMember of guildMembers) {
      partyNames.push(guildMember.displayName);
    }

    const alert = await textChannel.send({
      content: `Voting has started. Party consists of: ${partyNames.join(
        ", "
      )}`,
    });

    // send individual messages to each of the users waiting for them to vote
    const successButton = new ButtonBuilder()
      .setCustomId("pass")
      .setLabel("Pass")
      .setStyle(ButtonStyle.Primary);

    const failButton = new ButtonBuilder()
      .setCustomId("fail")
      .setLabel("Fail")
      .setStyle(ButtonStyle.Primary);

    const vote_row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      successButton,
      failButton
    );

    // Send the vote message to each party member's private DMs and collect votes
    const voteResults = new Map<string, "pass" | "fail">();

    await Promise.all(
      guildMembers.map(async (guildMember) => {
        try {
          const dmChannel = await guildMember.createDM();
          const voteMsg = await dmChannel.send({
            content: `Vote for the party`,
            components: [vote_row.toJSON()],
          });

          const vote_collector = voteMsg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 30_000, // 30 seconds
          });

          vote_collector.on("collect", async (i) => {
            if (i.customId === "pass" || i.customId === "fail") {
              voteResults.set(guildMember.id, i.customId as "pass" | "fail");
              await i.reply({
                content: `You voted: ${
                  i.customId === "pass" ? "Pass" : "Fail"
                }`,
              });
            }
          });

          await new Promise((resolve) => vote_collector.on("end", resolve));
        } catch (err) {
          console.error(
            `Failed to send DM to ${guildMember.displayName}:`,
            err
          );
        }
      })
    );

    console.log(voteResults);

    // voteResults now contains the votes ("pass" or "fail") keyed by user ID
    await textChannel.send({
      content: `Votes have concluded. The results are: ${Array.from(
        voteResults.values()
      ).join(", ")}`,
    });
  },
};

export default voteCommand;
