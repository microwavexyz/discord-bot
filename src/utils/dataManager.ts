import { Client } from 'discord.js';
import { readData, writeData } from './dataStorage';

let verificationRequests = new Map<string, string>(readData('verificationRequests') || []);
let completedRequests = readData('completedRequests') || [];
let users = readData('users') || [];

export const getVerificationRequests = () => verificationRequests;
export const setVerificationRequests = (requests: Map<string, string>) => {
  verificationRequests = requests;
  writeData('verificationRequests', Array.from(verificationRequests.entries()));
};

export const getCompletedRequests = () => completedRequests;
export const setCompletedRequests = (requests: any[]) => {
  completedRequests = requests;
  writeData('completedRequests', completedRequests);
};

export const getUsers = async (client: Client) => {
  const guild = client.guilds.cache.first(); // Assumes only one guild
  if (!guild) return [];

  const members = await guild.members.fetch();
  const users = members.map(member => ({
    id: member.user.id,
    tag: member.user.tag,
    avatar: member.user.displayAvatarURL(),
  }));
  
  setUsers(users);
  return users;
};

export const setUsers = (updatedUsers: any[]) => {
  users = updatedUsers;
  writeData('users', users);
};

// Periodic save
setInterval(() => {
  writeData('verificationRequests', Array.from(verificationRequests.entries()));
  writeData('completedRequests', completedRequests);
  writeData('users', users);
}, 60000); // Save every 60 seconds
