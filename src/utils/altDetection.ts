import { GuildMember } from 'discord.js';
import { getJoinLogs } from './joinLogger';

export const checkAltAccount = async (member: GuildMember): Promise<boolean> => {
  const accountAge = (Date.now() - member.user.createdAt.getTime()) / (1000 * 60 * 60 * 24); // account age in days
  const joinTime = member.joinedTimestamp ? (Date.now() - member.joinedTimestamp) / (1000 * 60) : Infinity; // time since joined in minutes

  if (accountAge < 7 || joinTime < 5) {
    return true;
  }

  // Additional check: users who joined from the same invite link within a short period
  const joinLogs = getJoinLogs();
  const recentJoins = Object.values(joinLogs).filter((log: any) => {
    return log.inviteCode === joinLogs[member.id].inviteCode && log.joinTimestamp && (Date.now() - log.joinTimestamp) / (1000 * 60) < 10;
  });

  if (recentJoins.length > 3) { // If more than 3 users joined from the same invite link within the last 10 minutes
    return true;
  }

  return false;
};
