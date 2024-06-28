const { SlashCommandBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Setup the ticket panel')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

  async execute(interaction) {
    // Check if the user has the necessary permissions
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      return;
    }

    // Check if the bot has the necessary permissions
    if (!interaction.guild.members.me.permissions.has([
      PermissionsBitField.Flags.SendMessages, 
      PermissionsBitField.Flags.ManageChannels,
      PermissionsBitField.Flags.EmbedLinks
    ])) {
      await interaction.reply({ 
        content: 'I do not have the required permissions to setup the ticket panel. I need permissions to Send Messages, Manage Channels, and Embed Links.', 
        ephemeral: true 
      });
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

      const logChannel = interaction.guild.channels.cache.find(channel => channel.name === 'mod-logs');
      if (logChannel) {
        await logChannel.send(`Ticket panel set up by ${interaction.user.tag} in ${panelChannel}.`);
      }
    } catch (error) {
      console.error(`Failed to setup ticket panel: ${error}`);
      await interaction.reply({ content: 'Failed to setup ticket panel. Please try again later.', ephemeral: true });
    }
  },
};