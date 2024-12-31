import { ChatInputCommandInteraction, Client, ClientOptions, Collection, REST, Routes, SlashCommandBuilder } from "discord.js";
import startCommand from "./commands/utility/start.js";
import { readEnv } from "./env.js";

interface CommandData {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => void | Promise<void>;
}

export default class AvalonClient extends Client {
  #rest: REST = new REST().setToken(readEnv("DISCORD_TOKEN"));
  commands = new Collection<string, CommandData>();
  messageCache = new Map<string, string>(); // used for translation (user msg id: bot msg id)
  constructor(options: ClientOptions) {
    super(options);
    this.addToCollection(startCommand)
    this.loadCommands();
  }

  addToCollection(listener: CommandData) {
    this.commands.set(listener.data.name, listener);
  }

  // register all the commands
  async loadCommands() {
    await this.#rest.put(Routes.applicationCommands(readEnv("DISCORD_CLIENT_ID")), {
      body: this.commands.map((c) => c.data.toJSON()),
    });
  }
}