const { SlashCommandBuilder, PermissionsBitField, GuildMemberRoleManager, EmbedBuilder } = require('discord.js');
const caseManager = require('../utils/casemanager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a user')
    .addUserOption(option => option.setName('target').setDescription('The user to timeout').setRequired(true))
    .addStringOption(option => option.setName('duration').setDescription('Duration of the timeout (e.g., 10m, 1h, 2d)').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for the timeout')),
  async execute(interaction) {
    const options = interaction.options;
    const user = options.getUser('target', true);
    const durationInput = options.getString('duration', true);
    const reason = options.getString('reason') || 'No reason provided';
    const moderator = interaction.user.tag;

    if (user.id === interaction.user.id || user.id === interaction.client.user.id) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Invalid Target')
        .setDescription('You cannot timeout yourself or the bot.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Permission Denied')
        .setDescription('I do not have permission to timeout users in this server.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.ModerateMembers)) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Permission Denied')
        .setDescription('You do not have permission to timeout users in this server.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const durationRegex = /^(\d+)([smhdwM])$/;
    const match = durationInput.match(durationRegex);
    if (!match) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Invalid Duration')
        .setDescription('Invalid duration format. Please use a format like 10m, 1h, 2d, etc.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const value = parseInt(match[1]);
    const unit = match[2];
    let durationMs;

    switch (unit) {
      case 's':
        durationMs = value * 1000;
        break;
      case 'm':
        durationMs = value * 60 * 1000;
        break;
      case 'h':
        durationMs = value * 60 * 60 * 1000;
        break;
      case 'd':
        durationMs = value * 24 * 60 * 60 * 1000;
        break;
      case 'w':
        durationMs = value * 7 * 24 * 60 * 60 * 1000;
        break;
      case 'M':
        durationMs = value * 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('Invalid Duration Unit')
          .setDescription('Invalid duration unit. Use s, m, h, d, w, or M.');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }

    try {
      const member = await interaction.guild?.members.fetch(user.id);
      if (!member) {
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('User Not Found')
          .setDescription('User not found in this server.');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      if (
        interaction.guild.members.me &&
        interaction.guild.members.me.roles instanceof GuildMemberRoleManager &&
        interaction.guild.members.me.roles.highest.position <= member.roles.highest.position
      ) {
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('Action Denied')
          .setDescription('I cannot timeout this user due to role hierarchy.');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      if (
        interaction.member &&
        interaction.member.roles instanceof GuildMemberRoleManager &&
        interaction.member.roles.highest.position <= member.roles.highest.position
      ) {
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('Action Denied')
          .setDescription('You cannot timeout this user due to role hierarchy.');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      await member.timeout(durationMs, reason);
      const caseNumber = await caseManager.createCase(user.tag, moderator, 'timeout', reason);

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('User Timed Out')
        .setDescription(`Timed out ${user.tag} for ${durationInput} for: ${reason}`)
        .addFields(
          { name: 'Case Number', value: `${caseNumber}`, inline: true },
          { name: 'Moderator', value: `${moderator}`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: false });
    } catch (error) {
      console.error(error);
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Error')
        .setDescription('An error occurred while trying to timeout the user.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
