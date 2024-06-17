const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const caseManager = require('../utils/casemanager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnclear')
    .setDescription('Clears all warnings for a specified user')
    .addUserOption(option => option.setName('user').setDescription('The user to clear warnings for').setRequired(true)),
  async execute(interaction) {
    const options = interaction.options;
    const user = options.getUser('user', true);

    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Permission Denied')
        .setDescription('I do not have permission to manage messages in this server.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageMessages)) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Permission Denied')
        .setDescription('You do not have permission to manage messages in this server.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    try {
      const result = await caseManager.clearWarnings(user.id);
      if (result.deletedCount > 0) {
        const embed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('Warnings Cleared')
          .setDescription(`Cleared all warnings for ${user.tag}.`);
        await interaction.reply({ embeds: [embed], ephemeral: true });
      } else {
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('No Warnings Found')
          .setDescription(`${user.tag} has no warnings.`);
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      console.error('Error clearing warnings:', error);
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Error')
        .setDescription('There was an error trying to clear warnings.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
