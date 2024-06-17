const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const caseManager = require('../utils/casemanager');

const warningsFile = path.join(__dirname, '../data/warnings.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warns a user')
    .addUserOption(option => option.setName('user').setDescription('The user to warn').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('The reason for warning').setRequired(true)),
  async execute(interaction) {
    const options = interaction.options;
    const user = options.getUser('user', true);
    const reason = options.getString('reason', true);
    const moderator = interaction.user.tag;

    // Permissions check: ensure the bot has permission to manage messages
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      await interaction.reply({ content: 'I do not have permission to warn users in this server.', ephemeral: true });
      return;
    }

    // Check if the member has permission to warn users
    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageMessages)) {
      await interaction.reply({ content: 'You do not have permission to warn users in this server.', ephemeral: true });
      return;
    }

    let warnings = {};

    try {
      if (fs.existsSync(warningsFile)) {
        warnings = JSON.parse(fs.readFileSync(warningsFile, 'utf-8'));
      }

      if (!warnings[user.id]) {
        warnings[user.id] = [];
      }

      warnings[user.id].push({ reason, date: new Date().toISOString() });

      fs.writeFileSync(warningsFile, JSON.stringify(warnings, null, 2));

      const caseNumber = caseManager.createCase(user.tag, moderator, 'warn', reason);
      await interaction.reply({ content: `Warned ${user.tag} for: ${reason}. Case #${caseNumber}`, ephemeral: false });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'There was an error trying to warn the user.', ephemeral: true });
    }
  },
};
