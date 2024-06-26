const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const caseManager = require('../utils/casemanager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cases')
    .setDescription('Fetches moderation cases for a user or all users')
    .addUserOption(option => option.setName('user').setDescription('The user to fetch cases for').setRequired(false)),
  
  async execute(interaction) {
    const user = interaction.options.getUser('user');

    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.ReadMessageHistory)) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Permission Denied')
        .setDescription('I do not have permission to read message history in this server.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    try {
      let cases;
      if (user) {
        cases = await caseManager.getCasesByUser(user.tag);
      } else {
        cases = await caseManager.getAllCases();
      }

      if (!cases || cases.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('No Cases Found')
          .setDescription(user ? `${user.tag} has no cases.` : 'No cases found.');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(user ? `Cases for ${user.tag}` : 'All Cases')
        .setColor(0x00FF00)
        .setDescription(cases.map((c, index) => `**Case #${index + 1}**\nUser: ${c.user}\nModerator: ${c.moderator}\nCommand: ${c.command}\nReason: ${c.reason}\nDate: ${new Date(c.timestamp).toLocaleString()}`).join('\n\n'));

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('Error fetching cases:', error);
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Error')
        .setDescription('There was an error trying to fetch cases.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
