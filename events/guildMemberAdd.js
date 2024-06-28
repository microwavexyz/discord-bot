const { GuildMember, TextChannel, Collection } = require('discord.js');
const config = require('../config.json');

const {
  raidThreshold = 5,
  raidTimeFrame = 60000,
  cooldownPeriod = 300000,
  whitelist = [],
} = config;

const raidLog = new Collection();
const cooldownLog = new Set();
const whitelistSet = new Set(whitelist);

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    if (!(member instanceof GuildMember) || cooldownLog.has(member.guild.id) || whitelistSet.has(member.id)) {
      return;
    }

    console.log(`New member joined: ${member.user.tag}`);

    const now = Date.now();
    const guildLog = raidLog.get(member.guild.id) || [];
    const updatedLog = [...guildLog.filter(timestamp => now - timestamp < raidTimeFrame), now];
    raidLog.set(member.guild.id, updatedLog);

    if (updatedLog.length >= raidThreshold) {
      await this.handleRaid(member, updatedLog);
    }
  },

  async handleRaid(member, updatedLog) {
    const message = `Potential raid detected! ${updatedLog.length} members have joined in the last ${raidTimeFrame / 1000} seconds.`;
    console.log(message);

    const logChannel = member.guild.channels.cache.find(ch => ch.name === 'mod-logs' && ch instanceof TextChannel);
    if (logChannel) {
      await this.sendLogMessage(logChannel, message, member.guild);
    }

    await this.kickRaidMembers(member.guild, updatedLog);
    await this.deleteInvites(member.guild);

    cooldownLog.add(member.guild.id);
    setTimeout(() => cooldownLog.delete(member.guild.id), cooldownPeriod);
  },

  async sendLogMessage(logChannel, message, guild) {
    try {
      await logChannel.send(message);
      const adminRole = guild.roles.cache.find(role => role.name === 'Admin');
      if (adminRole) {
        await logChannel.send(`<@&${adminRole.id}> ${message}`);
      }
    } catch (error) {
      console.error('Failed to send message to log channel:', error);
    }
  },

  async kickRaidMembers(guild, updatedLog) {
    const membersToKick = guild.members.cache.filter(m => updatedLog.includes(m.joinedTimestamp));
    for (const member of membersToKick.values()) {
      try {
        await member.kick('Kicked due to raid detection');
      } catch (error) {
        console.error(`Failed to kick member ${member.user.tag}:`, error);
      }
    }
  },

  async deleteInvites(guild) {
    try {
      const invites = await guild.invites.fetch();
      await Promise.all(invites.map(invite => 
        invite.delete('Disabled due to raid detection').catch(error => 
          console.error(`Failed to delete invite ${invite.code}:`, error)
        )
      ));
    } catch (error) {
      console.error('Failed to fetch or delete invites:', error);
    }
  }
};