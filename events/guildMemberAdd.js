const { GuildMember, TextChannel } = require('discord.js');
const { setTimeout } = require('timers');
const config = require('../config.json');

const raidThreshold = config.raidThreshold || 5;
const raidTimeFrame = config.raidTimeFrame || 60000; 
const cooldownPeriod = config.cooldownPeriod || 300000;
const raidLog = new Map();
const cooldownLog = new Set();
const whitelist = new Set(config.whitelist);

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    if (!(member instanceof GuildMember)) return;

    if (cooldownLog.has(member.guild.id) || whitelist.has(member.id)) {
      return;
    }

    console.log(`New member joined: ${member.user.tag}`);

    const now = Date.now();
    const guildLog = raidLog.get(member.guild.id) || [];
    const updatedLog = guildLog.filter(timestamp => now - timestamp < raidTimeFrame);
    updatedLog.push(now);
    raidLog.set(member.guild.id, updatedLog);

    if (updatedLog.length >= raidThreshold) {
      const message = `Potential raid detected! ${updatedLog.length} members have joined in the last ${raidTimeFrame / 1000} seconds.`;
      console.log(message);

      const logChannel = member.guild.channels.cache.find(ch => ch.name === 'mod-logs' && ch instanceof TextChannel);
      if (logChannel) {
        try {
          await logChannel.send(message);
        } catch (error) {
          console.error('Failed to send message to log channel:', error);
        }
      }

      const adminRole = member.guild.roles.cache.find(role => role.name === 'Admin');
      if (adminRole && logChannel) {
        try {
          await logChannel.send(`<@&${adminRole.id}> ${message}`);
        } catch (error) {
          console.error('Failed to mention admin role:', error);
        }
      }

      const membersToKickOrBan = member.guild.members.cache.filter(m => updatedLog.includes(m.joinedTimestamp));
      for (const m of membersToKickOrBan.values()) {
        try {
          await m.kick('Kicked due to raid detection');
        } catch (error) {
          console.error(`Failed to kick member ${m.user.tag}:`, error);
        }
      }

      try {
        const invites = await member.guild.invites.fetch();
        for (const invite of invites.values()) {
          try {
            await invite.delete('Disabled due to raid detection');
          } catch (error) {
            console.error(`Failed to delete invite ${invite.code}:`, error);
          }
        }
      } catch (error) {
        console.error('Failed to fetch invites:', error);
      }

      cooldownLog.add(member.guild.id);
      setTimeout(() => cooldownLog.delete(member.guild.id), cooldownPeriod);
    }
  },
};
