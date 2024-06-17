const { SlashCommandBuilder, ChannelType } = require('discord.js');

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

    const targetMember = await interaction.guild.members.fetch(targetUser.id);

    if (!targetMember) {
      await interaction.reply({ content: 'User not found in this server.', ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      const userMessages = messages.filter(msg => msg.author.id === targetUser.id);

      for (const message of userMessages.values()) {
        await message.delete();
      }

      await interaction.followUp({ content: `Successfully deleted ${userMessages.size} messages from ${targetUser.tag} in ${channel.name}.`, ephemeral: true });
    } catch (error) {
      console.error('Error deleting messages:', error);
      await interaction.followUp({ content: 'An error occurred while trying to delete messages.', ephemeral: true });
    }
  },
};
