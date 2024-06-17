const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warningsFile = path.join(__dirname, '../data/warnings.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnclear')
    .setDescription('Clears all warnings for a specified user')
    .addUserOption(option => option.setName('user').setDescription('The user to clear warnings for').setRequired(true)),
  async execute(interaction) {
    const options = interaction.options;
    const user = options.getUser('user', true);

    // Permissions check: ensure the bot has permission to manage messages
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      await interaction.reply({ content: 'I do not have permission to manage messages in this server.', ephemeral: true });
      return;
    }

    // Check if the member has permission to manage messages
    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageMessages)) {
      await interaction.reply({ content: 'You do not have permission to manage messages in this server.', ephemeral: true });
      return;
    }

    let warnings = {};

    try {
      if (fs.existsSync(warningsFile)) {
        warnings = JSON.parse(fs.readFileSync(warningsFile, 'utf-8'));
      }

      if (warnings[user.id]) {
        delete warnings[user.id];
        fs.writeFileSync(warningsFile, JSON.stringify(warnings, null, 2));
        await interaction.reply({ content: `Cleared all warnings for ${user.tag}.`, ephemeral: true });
      } else {
        await interaction.reply({ content: `${user.tag} has no warnings.`, ephemeral: true });
      }
    } catch (error) {
      console.error('Error clearing warnings:', error);
      await interaction.reply({ content: 'There was an error trying to clear warnings.', ephemeral: true });
    }
  },
};
