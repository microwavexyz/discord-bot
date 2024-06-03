import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../types/command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Displays information about a user.')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The user you want to get information about')
        .setRequired(false)),
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('target') || interaction.user;
    const member = interaction.guild?.members.cache.get(target.id);

    if (!member) {
      await interaction.reply({ content: 'User not found.', ephemeral: true });
      return;
    }

    const roles = member.roles.cache.map(role => role.name).join(', ') || 'None';

    const embed = new EmbedBuilder()
      .setTitle(`${target.username}'s Info`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: 'Username', value: target.tag, inline: true },
        { name: 'User ID', value: target.id, inline: true },
        { name: 'Joined Server', value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'Unknown', inline: true },
        { name: 'Account Created', value: `<t:${Math.floor(target.createdAt.getTime() / 1000)}:R>`, inline: true },
        { name: 'Roles', value: roles, inline: true },
      )
      .setColor(0x00AE86);

    await interaction.reply({ embeds: [embed] });
  },
};
