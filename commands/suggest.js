const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, Guild, TextChannel, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Make a suggestion')
    .addStringOption(option =>
      option.setName('suggestion')
        .setDescription('Your suggestion')
        .setRequired(true)),
  async execute(interaction) {
    const suggestion = interaction.options.getString('suggestion', true);

    if (!suggestion) {
      await interaction.reply({ content: 'You need to provide a suggestion!', ephemeral: true });
      return;
    }

    const guild = interaction.guild;

    // Find or create the suggestions channel
    let suggestionsChannel = guild.channels.cache.find(channel => channel.name === 'suggestions' && channel.type === ChannelType.GuildText);
    if (!suggestionsChannel) {
      try {
        suggestionsChannel = await guild.channels.create({
          name: 'suggestions',
          type: ChannelType.GuildText,
          topic: 'Channel for user suggestions',
        });
      } catch (error) {
        console.error('Error creating suggestions channel:', error);
        await interaction.reply({ content: 'There was an error creating the suggestions channel!', ephemeral: true });
        return;
      }
    }

    try {
      const suggestionMessage = await suggestionsChannel.send(`New suggestion from ${interaction.user}:\n${suggestion}`);
      await suggestionMessage.react('👍');
      await suggestionMessage.react('👎');
      await interaction.reply({ content: 'Thank you for your suggestion!', ephemeral: true });
    } catch (error) {
      console.error('Error sending suggestion message:', error);
      await interaction.reply({ content: 'There was an error sending your suggestion!', ephemeral: true });
    }
  },
};
