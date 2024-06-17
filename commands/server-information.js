const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server-information')
    .setDescription('Displays information about the server'),
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
      .setTitle(`Server Info: ${guild.name}`)
      .setColor(0x00FF00)
      .addFields(
        { name: 'Server ID', value: guild.id, inline: true },
        { name: 'Owner', value: (await guild.fetchOwner()).user.tag, inline: true },
        { name: 'Members', value: guild.memberCount.toString(), inline: true },
        { name: 'Channels', value: guild.channels.cache.size.toString(), inline: true },
        { name: 'Roles', value: guild.roles.cache.size.toString(), inline: true },
        { name: 'Created At', value: guild.createdAt.toDateString(), inline: true }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    const iconURL = guild.iconURL();
    if (iconURL) {
      embed.setThumbnail(iconURL);
    }

    await interaction.reply({ embeds: [embed] });
  },
};
