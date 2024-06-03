import { GuildMember } from 'discord.js';
import fs from 'fs';
import path from 'path';

const logPath = path.join(__dirname, '../data/joinLogs.json');

// Ensure joinLogs.json exists
if (!fs.existsSync(logPath)) {
  fs.writeFileSync(logPath, JSON.stringify({}));
}

// Load join logs with error handling
let joinLogs: Record<string, { joinTimestamp: number; inviteCode: string }> = {};
try {
  joinLogs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
} catch (error) {
  console.error('Error reading joinLogs file:', error);
}

const saveJoinLogs = () => {
  try {
    fs.writeFileSync(logPath, JSON.stringify(joinLogs, null, 2));
  } catch (error) {
    console.error('Error saving joinLogs file:', error);
  }
};

export const logJoin = async (member: GuildMember, inviteCode: string) => {
  joinLogs[member.id] = {
    joinTimestamp: Date.now(),
    inviteCode,
  };
  saveJoinLogs();
};

export const getJoinLogs = () => joinLogs;
