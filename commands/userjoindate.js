const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userjoindate')
    .setDescription('Displays the date a user joined the server')
    .addUserOption(option => option.setName('user').setDescription('The user to get the join date for').setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);

    // Permissions check: ensure the bot has permission to send messages
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({ content: 'I need permission to send messages in this channel.', ephemeral: true });
    }

    const member = await interaction.guild?.members.fetch(user.id);

    if (!member) {
      await interaction.reply({ content: 'Could not find the specified user in the server.', ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`User Join Date: ${user.tag}`)
      .setDescription(`${user.tag} joined the server on ${member.joinedAt?.toDateString() || 'Unknown date'}`)
      .setColor(0x00FF00)
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
