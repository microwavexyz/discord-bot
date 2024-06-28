const { SlashCommandBuilder } = require('@discordjs/builders');
const { ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');

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
    const guild = interaction.guild;

    let suggestionsChannel = guild.channels.cache.find(channel => channel.name === 'suggestions' && channel.type === ChannelType.GuildText);
    if (!suggestionsChannel) {
      try {
        suggestionsChannel = await guild.channels.create({
          name: 'suggestions',
          type: ChannelType.GuildText,
          topic: 'Channel for user suggestions',
          permissionOverwrites: [
            {
              id: guild.roles.everyone,
              allow: [PermissionsBitField.Flags.ViewChannel],
              deny: [PermissionsBitField.Flags.SendMessages],
            }
          ],
        });
      } catch (error) {
        console.error('Error creating suggestions channel:', error);
        await interaction.reply({ content: 'There was an error creating the suggestions channel!', ephemeral: true });
        return;
      }
    }

    try {
      const suggestionEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('New Suggestion')
        .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setDescription(suggestion)
        .setTimestamp()
        .setFooter({ text: `Suggestion ID: ${Date.now()}` });

      const suggestionMessage = await suggestionsChannel.send({ embeds: [suggestionEmbed] });
      await suggestionMessage.react('👍');
      await suggestionMessage.react('👎');

      const replyEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('Suggestion Submitted')
        .setDescription(`Your suggestion has been successfully submitted to ${suggestionsChannel}.`)
        .addFields({ name: 'Your Suggestion', value: suggestion });

      await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
    } catch (error) {
      console.error('Error sending suggestion message:', error);
      await interaction.reply({ content: 'There was an error sending your suggestion!', ephemeral: true });
    }
  },
};