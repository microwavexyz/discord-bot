const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('baninfo')
    .setDescription('Displays information about banned users'),
  async execute(interaction) {
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Permission Denied')
        .setDescription('I do not have permission to view banned users in this server.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    try {
      // Fetch the bans
      const bans = await interaction.guild.bans.fetch();

      if (!bans.size) {
        const embed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('No Banned Users')
          .setDescription('No banned users found.');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      const banList = bans.map(ban => `${ban.user.tag} - ${ban.reason || 'No reason provided'}`).join('\n');

      const embed = new EmbedBuilder()
        .setTitle('Banned Users')
        .setDescription(banList)
        .setColor(0xFF0000)
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching ban info:', error);
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Error')
        .setDescription('There was an error fetching the ban information.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
