const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('Displays information about a role')
    .addRoleOption(option => option.setName('role').setDescription('The role to get information about').setRequired(true)),
  async execute(interaction) {
    
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({ content: 'I need permission to send messages in this channel.', ephemeral: true });
    }

    const role = interaction.options.getRole('role', true);

    const embed = new EmbedBuilder()
      .setTitle(`Role Info: ${role.name}`)
      .setColor(role.color)
      .addFields(
        { name: 'ID', value: role.id, inline: true },
        { name: 'Name', value: role.name, inline: true },
        { name: 'Color', value: role.hexColor, inline: true },
        { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
        { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
        { name: 'Position', value: role.position.toString(), inline: true },
        { name: 'Created At', value: role.createdAt.toDateString(), inline: true }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
