const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rolemembers')
    .setDescription('Lists all members with a specified role')
    .addRoleOption(option => option.setName('role').setDescription('The role to list members for').setRequired(true)),
  async execute(interaction) {
    const role = interaction.options.getRole('role', true);
    const members = role.members.map(member => member.user.tag).join('\n') || 'No members with this role.';

    const embed = new EmbedBuilder()
      .setTitle(`Members with the ${role.name} role`)
      .setDescription(members)
      .setColor(role.color);

    await interaction.reply({ embeds: [embed] });
  },
};
