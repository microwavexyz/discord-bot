import { Client, Message, TextChannel, EmbedBuilder } from 'discord.js';
import profanitiesData from '../data/profanities.json';

const profanities: Set<string> = new Set(profanitiesData.badWords);

export const badWordFilter = (client: Client) => {
  client.on('messageCreate', async (message: Message) => {
    if (message.author.bot) return; // Ignore messages from bots

    const lowerCaseContent = message.content.toLowerCase();
    const foundProfanities = Array.from(profanities).filter(word => lowerCaseContent.includes(word));

    if (foundProfanities.length > 0) {
      try {
        await message.delete(); // Delete the offending message

        // Send a warning to the user
        try {
          await message.author.send({
            content: `Your message in ${message.guild?.name} contained inappropriate language and was deleted.`,
          });
        } catch (dmError) {
          console.error('Error sending DM to user:', dmError);
        }

        // Optionally, log the incident to a moderation channel
        const logChannel = message.guild?.channels.cache.find(channel => channel.name === 'moderation-logs') as TextChannel;
        if (logChannel) {
          const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('Profanity Detected')
            .setDescription(`Message from ${message.author.tag} was deleted for containing profanity.`)
            .addFields(
              { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
              { name: 'Message', value: message.content, inline: false }
            )
            .setTimestamp();

          await logChannel.send({ embeds: [embed] });
        }
      } catch (error) {
        console.error('Error deleting message or sending log:', error);
      }
    }
  });
};
