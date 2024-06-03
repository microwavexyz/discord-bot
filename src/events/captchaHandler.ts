import { Client, GuildMember, TextChannel, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const RECAPTCHA_SITE_KEY = process.env.RECAPTCHA_SITE_KEY;
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

export const captchaHandler = (client: Client) => {
  client.on('guildMemberAdd', async (member: GuildMember) => {
    const captchaURL = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    
    const embed = new EmbedBuilder()
      .setTitle('CAPTCHA Verification')
      .setDescription(`Please complete the CAPTCHA verification to access the server: [Complete CAPTCHA](${captchaURL})`)
      .setColor('Blue');

    try {
      const captchaChannel = member.guild.channels.cache.find(channel => channel.name === 'captcha-verification') as TextChannel;
      if (captchaChannel) {
        await captchaChannel.send({ content: `<@${member.id}>`, embeds: [embed] });
      }
    } catch (error) {
      console.error('Error sending CAPTCHA message:', error);
    }
  });

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const isCaptchaResponse = message.content.startsWith('captcha:');
    if (isCaptchaResponse) {
      const captchaResponse = message.content.replace('captcha:', '').trim();

      try {
        const fetch = (await import('node-fetch')).default;
        const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${captchaResponse}`;
        const res = await fetch(verifyURL, { method: 'POST' });
        const data = (await res.json()) as { success: boolean };

        if (data.success) {
          await message.reply('CAPTCHA verification successful! Welcome to the server.');
          // Grant access to the server
        } else {
          await message.reply('CAPTCHA verification failed. Please try again.');
        }
      } catch (error) {
        console.error('Error verifying CAPTCHA:', error);
        await message.reply('There was an error verifying the CAPTCHA. Please try again later.');
      }
    }
  });
};
