const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('baninfo')
    .setDescription('Displays information about banned users'),
  async execute(interaction) {
    
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      await interaction.reply({ content: 'I do not have permission to view banned users in this server.', ephemeral: true });
      return;
    }

    try {
      // Fetch the bans
      const bans = await interaction.guild.bans.fetch();

      if (!bans.size) {
        await interaction.reply({ content: 'No banned users found.', ephemeral: true });
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
      await interaction.reply({ content: 'There was an error fetching the ban information.', ephemeral: true });
    }
  },
};
