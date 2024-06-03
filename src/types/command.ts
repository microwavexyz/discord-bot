import { SlashCommandOptionsOnlyBuilder, SlashCommandBuilder, ChatInputCommandInteraction, SlashCommandSubcommandsOnlyBuilder } from 'discord.js';

export type Command = {
  data: SlashCommandOptionsOnlyBuilder | SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};
