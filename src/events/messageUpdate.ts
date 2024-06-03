import { Message, PartialMessage, TextChannel, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

// Path to store AFK users
const afkFilePath = path.join(__dirname, '../data/afk.json');

// Function to get AFK users
const getAfkUsers = () => {
  const afkData = fs.readFileSync(afkFilePath, 'utf8');
  return JSON.parse(afkData);
}

export const messageUpdate = async (oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) => {
  try {
    if (oldMessage.partial) {
      try {
        oldMessage = await oldMessage.fetch();
      } catch (error) {
        console.error('Error fetching partial old message:', error);
        return;
      }
    }

    if (newMessage.partial) {
      try {
        newMessage = await newMessage.fetch();
      } catch (error) {
        console.error('Error fetching partial new message:', error);
        return;
      }
    }

    if (oldMessage.author?.bot) return; // Ignore bot messages

    if (oldMessage.content === newMessage.content) return; // Ignore if the content hasn't changed

    const afkUsers = getAfkUsers();

    // Notify if mentioned users are AFK
    const mentionedUsers = newMessage.mentions.users;
    mentionedUsers.forEach(user => {
      if (afkUsers[user.id]) {
        const afkUser = afkUsers[user.id];
        const afkTimestamp = new Date(afkUser.timestamp).toLocaleString();
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('User is AFK')
          .setDescription(`${user.tag} is AFK: ${afkUser.message}`)
          .addFields(
            { name: 'Went AFK at', value: afkTimestamp, inline: true }
          )
          .setTimestamp(new Date(afkUser.timestamp));

        newMessage.channel.send({ embeds: [embed] });
      }
    });

    // Log the message edit
    const logChannel = oldMessage.guild?.channels.cache.find(channel => channel.name === 'logs') as TextChannel;
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle('Message Edited')
      .addFields(
        { name: 'Author', value: oldMessage.author?.tag || 'Unknown', inline: true },
        { name: 'Channel', value: `<#${oldMessage.channel.id}>`, inline: true },
        { name: 'Before', value: oldMessage.content || 'None', inline: false },
        { name: 'After', value: newMessage.content || 'None', inline: false }
      )
      .setTimestamp();

    // Include old attachments if any
    if (oldMessage.attachments.size > 0) {
      embed.addFields({
        name: 'Old Attachments',
        value: oldMessage.attachments.map(att => att.url).join('\n'),
        inline: false
      });
    }

    // Include new attachments if any
    if (newMessage.attachments.size > 0) {
      embed.addFields({
        name: 'New Attachments',
        value: newMessage.attachments.map(att => att.url).join('\n'),
        inline: false
      });
    }

    // Include old embeds if any
    if (oldMessage.embeds.length > 0) {
      embed.addFields({
        name: 'Old Embeds',
        value: 'Message contained embeds.',
        inline: false
      });
    }

    // Include new embeds if any
    if (newMessage.embeds.length > 0) {
      embed.addFields({
        name: 'New Embeds',
        value: 'Message contains embeds.',
        inline: false
      });
    }

    await logChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Error handling message update:', error);
  }
};
