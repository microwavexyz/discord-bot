const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rolelist')
    .setDescription('Lists all roles in the server'),
  async execute(interaction) {
    // Permissions check: ensure the bot has permission to send messages
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({ content: 'I need permission to send messages in this channel.', ephemeral: true });
    }

    const roles = interaction.guild?.roles.cache.map(role => `${role.name} (ID: ${role.id})`).join('\n') || 'No roles found.';

    const embed = new EmbedBuilder()
      .setTitle('Server Roles')
      .setDescription(roles)
      .setColor(0x00FF00)
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
