const { SlashCommandBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Setup the ticket panel'),
  async execute(interaction) {
    if (!interaction.guild.members.me.permissions.has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels])) {
      await interaction.reply({ content: 'I do not have the required permissions to setup the ticket panel.', ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('Support Tickets')
      .setDescription('Click the button below to create a ticket.')
      .setColor(0x00FF00);

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('create_ticket')
          .setLabel('Create Ticket')
          .setStyle(ButtonStyle.Primary)
      );

    try {
      const panelChannel = interaction.channel;
      await panelChannel.send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: 'Ticket panel setup complete.', ephemeral: true });
    } catch (error) {
      console.error(`Failed to setup ticket panel: ${error}`);
      await interaction.reply({ content: 'Failed to setup ticket panel. Please try again later.', ephemeral: true });
    }
  },
};
