const { SlashCommandBuilder, PermissionsBitField, GuildMemberRoleManager } = require('discord.js');
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

    // Permissions check: ensure the bot has permission to moderate members
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      await interaction.reply({ content: 'I do not have permission to timeout users in this server.', ephemeral: true });
      return;
    }

    // Check if the member has permission to timeout users
    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.ModerateMembers)) {
      await interaction.reply({ content: 'You do not have permission to timeout users in this server.', ephemeral: true });
      return;
    }

    // Parse duration
    const durationRegex = /^(\d+)([smhdwM])$/;
    const match = durationInput.match(durationRegex);
    if (!match) {
      await interaction.reply({ content: 'Invalid duration format. Please use a format like 10m, 1h, 2d, etc.', ephemeral: true });
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
        durationMs = value * 30 * 24 * 60 * 60 * 1000;  // Approximate month duration
        break;
      default:
        await interaction.reply({ content: 'Invalid duration unit. Use s, m, h, d, w, or M.', ephemeral: true });
        return;
    }

    try {
      const member = await interaction.guild?.members.fetch(user.id);
      if (!member) {
        await interaction.reply({ content: 'User not found in this server.', ephemeral: true });
        return;
      }

      // Check role hierarchy for the bot
      if (
        interaction.guild.members.me &&
        interaction.guild.members.me.roles instanceof GuildMemberRoleManager &&
        interaction.guild.members.me.roles.highest.position <= member.roles.highest.position
      ) {
        await interaction.reply({ content: 'I cannot timeout this user due to role hierarchy.', ephemeral: true });
        return;
      }

      // Check role hierarchy for the command invoker
      if (
        interaction.member &&
        interaction.member.roles instanceof GuildMemberRoleManager &&
        interaction.member.roles.highest.position <= member.roles.highest.position
      ) {
        await interaction.reply({ content: 'You cannot timeout this user due to role hierarchy.', ephemeral: true });
        return;
      }

      // Timeout the user
      await member.timeout(durationMs, reason);
      const caseNumber = caseManager.createCase(user.tag, moderator, 'timeout', reason);
      await interaction.reply(`Timed out ${user.tag} for ${durationInput} for: ${reason}. Case #${caseNumber}`);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'An error occurred while trying to timeout the user.', ephemeral: true });
    }
  },
};
