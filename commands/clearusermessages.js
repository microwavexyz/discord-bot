const { SlashCommandBuilder, ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearusermessages')
    .setDescription('Deletes all messages sent by a specific user in a channel')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user whose messages will be deleted')
        .setRequired(true)
    )
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription('The channel to clear messages from (defaults to current channel)')
        .addChannelTypes(ChannelType.GuildText)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),

  async execute(interaction) {
    // Check if the user has permission to manage messages
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ embeds: [createErrorEmbed('Permission Denied', 'You need the Manage Messages permission to use this command.')], ephemeral: true });
    }

    if (!interaction.guild) {
      return interaction.reply({ embeds: [createErrorEmbed('Guild Only', 'This command can only be used in a server.')], ephemeral: true });
    }

    const targetUser = interaction.options.getUser('user', true);
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    if (channel.type !== ChannelType.GuildText) {
      return interaction.reply({ embeds: [createErrorEmbed('Invalid Channel', 'This command can only be used in text channels.')], ephemeral: true });
    }

    if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ embeds: [createErrorEmbed('Permission Denied', 'I need the Manage Messages permission to execute this command.')], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      let deletedMessagesCount = 0;
      let lastMessageId = null;
      const startTime = Date.now();

      while (true) {
        const messages = await channel.messages.fetch({ limit: 100, before: lastMessageId });
        const userMessages = messages.filter(msg => msg.author.id === targetUser.id);

        if (userMessages.size === 0) break;

        await channel.bulkDelete(userMessages, true);
        deletedMessagesCount += userMessages.size;
        lastMessageId = messages.last().id;

        if (messages.size < 100) break;
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      const embed = new EmbedBuilder()
        .setColor(0x4CAF50)
        .setTitle('🧹 User Messages Cleared')
        .setDescription(`Successfully deleted messages from ${targetUser}.`)
        .addFields(
          { name: 'User', value: `<@${targetUser.id}>`, inline: true },
          { name: 'Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Messages Deleted', value: `${deletedMessagesCount}`, inline: true },
          { name: 'Duration', value: `${duration} seconds`, inline: true },
          { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setFooter({ text: 'Some messages older than 2 weeks may not have been deleted' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      // Send a temporary message in the channel
      const tempMsg = await channel.send({ embeds: [embed] });
      setTimeout(() => tempMsg.delete().catch(() => {}), 30000); // Delete after 30 seconds

    } catch (error) {
      console.error('Error deleting messages:', error);
      await interaction.editReply({ embeds: [createErrorEmbed('Error', 'An error occurred while trying to delete messages.')] });
    }
  },
};

function createErrorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0xE74C3C)
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setTimestamp();
}