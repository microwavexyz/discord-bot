const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearusermessages')
    .setDescription('Deletes all messages sent by a specific user in this channel.')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user whose messages will be deleted')
        .setRequired(true)
    )
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription('The channel to clear messages from')
        .setRequired(false)
        .addChannelTypes(ChannelType.GuildText)
    ),
  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
      return;
    }

    const options = interaction.options;
    const targetUser = options.getUser('user', true);
    const targetChannel = options.getChannel('channel');
    const channel = targetChannel || interaction.channel;

    if (channel.type !== ChannelType.GuildText) {
      await interaction.reply({ content: 'This command can only be used in text channels.', ephemeral: true });
      return;
    }

    if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.ManageMessages)) {
      await interaction.reply({ content: 'I need the Manage Messages permission to execute this command.', ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      let deletedMessagesCount = 0;
      let lastMessageId = null;

      while (true) {
        const fetchOptions = { limit: 100 };
        if (lastMessageId) fetchOptions.before = lastMessageId;

        const messages = await channel.messages.fetch(fetchOptions);
        const userMessages = messages.filter(msg => msg.author.id === targetUser.id);

        if (userMessages.size === 0) break;

        await channel.bulkDelete(userMessages, true);
        deletedMessagesCount += userMessages.size;
        lastMessageId = messages.last().id;

        if (messages.size < 100) break;
      }

      await interaction.followUp({ content: `Successfully deleted ${deletedMessagesCount} messages from ${targetUser.tag} in ${channel.name}.`, ephemeral: true });
    } catch (error) {
      console.error('Error deleting messages:', error);
      await interaction.followUp({ content: 'An error occurred while trying to delete messages.', ephemeral: true });
    }
  },
};
