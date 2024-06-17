const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverboosts')
    .setDescription('Displays the number of server boosts'),
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
      .setTitle('Server Boosts')
      .addFields(
        { name: 'Boost Level', value: guild.premiumTier.toString(), inline: true },
        { name: 'Boost Count', value: guild.premiumSubscriptionCount?.toString() || '0', inline: true },
      )
      .setColor(0xFF00FF)
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
