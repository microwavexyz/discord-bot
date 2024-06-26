const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('Displays information about a role')
    .addRoleOption(option => option.setName('role').setDescription('The role to get information about').setRequired(true)),
  async execute(interaction) {
    // Check if the bot has permission to send messages
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
        { name: 'Created At', value: role.createdAt.toDateString(), inline: true },
        { name: 'Members', value: role.members.size.toString(), inline: true }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    try {
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error sending role info:', error);
      await interaction.reply({ content: 'An error occurred while fetching the role information. Please try again.', ephemeral: true });
    }
  },
};
