const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, time } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userjoindate')
    .setDescription('Displays the date and time a user joined the server')
    .addUserOption(option => option.setName('user').setDescription('The user to get the join date for').setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({ content: 'I need permission to send messages in this channel.', ephemeral: true });
    }
    const member = await interaction.guild?.members.fetch(user.id);
    if (!member) {
      await interaction.reply({ content: 'Could not find the specified user in the server.', ephemeral: true });
      return;
    }

    const joinedAt = member.joinedAt;
    const joinedTimestamp = joinedAt ? time(joinedAt, 'F') : 'Unknown date and time';
    const joinedDate = joinedAt ? joinedAt.toDateString() : 'Unknown date';

    const embed = new EmbedBuilder()
      .setTitle(`User Join Date: ${user.tag}`)
      .setDescription(`${user.tag} joined the server on ${joinedDate}\n\nTimestamp: ${joinedTimestamp}`)
      .setColor(0x00FF00)
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
