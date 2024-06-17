const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverbanner')
    .setDescription('Displays the server\'s banner image'),
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

    const bannerURL = guild.bannerURL({ size: 512 });

    if (!bannerURL) {
      await interaction.reply({ content: 'This server does not have a banner image.', ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`Server Banner for ${guild.name}`)
      .setImage(bannerURL)
      .setColor(0x00FF00)
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
