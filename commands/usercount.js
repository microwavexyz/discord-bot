const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('usercount')
    .setDescription('Displays the total number of users in the server'),
  async execute(interaction) {
    const { guild } = interaction;

    if (!guild) {
      await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
      return;
    }

    // Permissions check: ensure the bot has permission to send messages
    if (!guild.members.me?.permissions.has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({ content: 'I need permission to send messages in this channel.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('User Count')
      .setDescription(`This server has ${guild.memberCount} members.`)
      .setColor(0x00FF00)
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
