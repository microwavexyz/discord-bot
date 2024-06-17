const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userroles')
    .setDescription('Displays all roles assigned to a user')
    .addUserOption(option => option.setName('user').setDescription('The user to get roles for').setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);

    // Permissions check: ensure the bot has permission to send messages
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({ content: 'I need permission to send messages in this channel.', ephemeral: true });
    }

    const member = await interaction.guild?.members.fetch(user.id);

    if (!member) {
      await interaction.reply({ content: 'User not found in this server.', ephemeral: true });
      return;
    }

    const roles = member.roles.cache
      .filter(role => role.id !== interaction.guild?.id) // Exclude @everyone role
      .map(role => role.name)
      .join(', ') || 'No roles';

    const embed = new EmbedBuilder()
      .setTitle(`Roles for ${user.tag}`)
      .setDescription(roles)
      .setColor(0x00FF00)
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
