const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Displays information about a user')
    .addUserOption(option => option.setName('target').setDescription('The user to get info about')),
  async execute(interaction) {
    // Permissions check: ensure the bot has permission to send messages
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({ content: 'I need permission to send messages in this channel.', ephemeral: true });
    }

    const user = interaction.options.getUser('target') || interaction.user;
    const member = interaction.guild?.members.cache.get(user.id);

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ size: 512 }))
      .addFields(
        { name: 'ID', value: user.id, inline: true },
        { name: 'Username', value: user.username, inline: true },
        { name: 'Discriminator', value: `#${user.discriminator}`, inline: true },
        { name: 'Joined Server', value: member?.joinedAt?.toLocaleDateString() || 'N/A', inline: true },
        { name: 'Joined Discord', value: user.createdAt.toLocaleDateString(), inline: true },
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
