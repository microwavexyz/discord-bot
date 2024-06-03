import { GuildMember, PartialGuildMember, EmbedBuilder, TextChannel } from 'discord.js';

export const guildMemberRemove = async (member: GuildMember | PartialGuildMember) => {
  const logChannelId = '1242653928902889533'; // Replace with your actual log channel ID
  const logChannel = member.guild.channels.cache.get(logChannelId) as TextChannel;
  if (!logChannel) return;

  try {
    let fullMember: GuildMember;
    if (member instanceof GuildMember) {
      fullMember = member;
    } else {
      fullMember = await member.guild.members.fetch(member.id);
    }

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('Member Left')
      .setDescription(`${fullMember.user.tag} has left the server.`)
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Error handling member removal:', error);
  }
};
