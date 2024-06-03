import { GuildMember, TextChannel, MessageReaction, User } from 'discord.js';
import { client } from '../index';
import config from '../config.json';

export const startVerification = async (member: GuildMember, channel: TextChannel) => {
  const verificationMessage = await channel.send(`Welcome ${member.user.tag}! Please verify yourself by reacting to this message with ✅.`);
  await verificationMessage.react('✅');

  const filter = (reaction: MessageReaction, user: User) => reaction.emoji.name === '✅' && user.id === member.id;
  const collector = verificationMessage.createReactionCollector({ filter, time: 60000 });

  collector.on('collect', async () => {
    await member.roles.add(config.verifiedRoleId);
    await member.send('You have been verified and given access to the server.');
    collector.stop();
  });

  collector.on('end', collected => {
    if (collected.size === 0) {
      channel.send(`${member.user.tag} did not verify in time and has been removed from the server.`);
      member.kick('Failed to verify in time.');
    }
  });
};
