import { Message, PartialMessage, TextChannel, EmbedBuilder } from 'discord.js';

const logChannelId = '1245466373677781105'; // Replace with your actual log channel ID

export const messageDelete = async (message: Message | PartialMessage) => {
  if (message.partial) {
    try {
      message = await message.fetch();
    } catch (error) {
      console.error('Error fetching partial message:', error);
      return;
    }
  }

  if (message.author?.bot) return; // Ignore bot messages

  const logChannel = message.guild?.channels.cache.get(logChannelId) as TextChannel;
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle('Message Deleted')
    .addFields(
      { name: 'Author', value: message.author?.tag || 'Unknown', inline: true },
      { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
      { name: 'Content', value: message.content || 'None', inline: false }
    )
    .setTimestamp();

  try {
    await logChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Error sending log message:', error);
  }
};
