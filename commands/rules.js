const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rules')
    .setDescription('Displays the server rules'),
  async execute(interaction) {
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({ content: 'I need permission to send messages in this channel.', ephemeral: true });
    }

    const rulesFile = './rules.txt';

    try {
      const rules = await fs.readFile(rulesFile, 'utf-8');

      const embed = new EmbedBuilder()
        .setTitle('Server Rules')
        .setDescription(rules)
        .setColor(0xFF0000)
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error reading rules file:', error);
      await interaction.reply({ content: 'There was an error reading the rules file. Please contact the administrator.', ephemeral: true });
    }
  },
};
