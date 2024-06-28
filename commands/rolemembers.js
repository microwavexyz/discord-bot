const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rolemembers')
    .setDescription('Lists all members with a specified role')
    .addRoleOption(option => option.setName('role').setDescription('The role to list members for').setRequired(true)),
  async execute(interaction) {
    const role = interaction.options.getRole('role', true);
    
    let memberList = role.members.map(member => `<@${member.id}>`);
    
    if (memberList.length === 0) {
      memberList = ['No members with this role.'];
    }

    const embed = new EmbedBuilder()
      .setTitle(`Members with the ${role.name} role`)
      .setColor(role.color)
      .setFooter({ text: `Total members: ${memberList.length}` });

    // Split the member list into chunks of 1024 characters (Discord's limit for field value)
    const chunkSize = 1024;
    for (let i = 0; i < memberList.length; i += chunkSize) {
      const chunk = memberList.slice(i, i + chunkSize);
      embed.addFields({ name: '\u200B', value: chunk.join('\n') });
    }

    await interaction.reply({ embeds: [embed] });
  },
};