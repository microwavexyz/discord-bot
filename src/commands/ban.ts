import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionsBitField, TextChannel, GuildMember } from 'discord.js';
import { Command } from '../types/command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server.')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The user to ban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false)),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'This command can only be used in a guild.', ephemeral: true });
      return;
    }

    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.BanMembers)) {
      await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      return;
    }

    const botMember = interaction.guild.members.me;
    if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      await interaction.reply({ content: 'I do not have permission to ban members.', ephemeral: true });
      return;
    }

    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) {
      await interaction.reply({ content: 'User not found.', ephemeral: true });
      return;
    }

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) {
      await interaction.reply({ content: 'User not found in the server.', ephemeral: true });
      return;
    }

    if (member.roles.highest.position >= botMember.roles.highest.position) {
      await interaction.reply({ content: 'I cannot ban this user as they have a higher or equal role than me.', ephemeral: true });
      return;
    }

    try {
      await member.ban({ reason });

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('User Banned')
        .addFields(
          { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
          { name: 'Reason', value: reason, inline: true },
        )
        .setTimestamp();

      const logChannel = interaction.guild.channels.cache.find(channel => channel.name === 'mod-logs') as TextChannel;

      if (logChannel) {
        await logChannel.send({ embeds: [embed] });
      }

      await interaction.reply({ content: `${target.tag} has been banned for: ${reason}` });
    } catch (error) {
      console.error('Error banning user:', error);

      if (error instanceof Error) {
        await interaction.reply({ content: `Failed to ban user due to error: ${error.message}`, ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error banning the user. Please try again later.', ephemeral: true });
      }
    }
  },
};
