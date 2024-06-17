const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rules')
    .setDescription('Displays the server rules'),
  async execute(interaction) {
    // Permissions check: ensure the bot has permission to send messages
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({ content: 'I need permission to send messages in this channel.', ephemeral: true });
    }

    const rulesFile = './rules.txt';

    if (!fs.existsSync(rulesFile)) {
      await interaction.reply({ content: 'No rules file found.', ephemeral: true });
      return;
    }

    const rules = fs.readFileSync(rulesFile, 'utf-8');

    const embed = new EmbedBuilder()
      .setTitle('Server Rules')
      .setDescription(rules)
      .setColor(0xFF0000)
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
