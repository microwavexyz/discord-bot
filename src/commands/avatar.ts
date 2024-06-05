import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types/command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Displays the avatar of a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to get the avatar of')
        .setRequired(false)),
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const user = interaction.options.getUser('user') || interaction.user;
      const avatarURL = user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith('a_') ? 'gif' : 'png'}?size=512`
        : user.defaultAvatarURL;

      const embed = new EmbedBuilder()
        .setTitle(`${user.tag}'s Avatar`)
        .setImage(avatarURL)
        .setColor(0x00AE86)
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ size: 32 }) })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching avatar:', error);
      await interaction.reply({ content: 'There was an error fetching the avatar. Please try again later.', ephemeral: true });
    }
  },
};
