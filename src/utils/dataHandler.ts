import fs from 'fs';
import path from 'path';

const balancesPath = path.join(__dirname, '../data/balances.json');

interface UserBalance {
  balance: number;
  lastClaimed: number;
  username?: string;
}

interface Data {
  users: Record<string, UserBalance>;
}

const readData = (filePath: string): Data => {
  try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error reading data:', error);
    return { users: {} };
  }
};

const writeData = (filePath: string, data: Data): void => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing data:', error);
  }
};

export const getUserBalance = (userId: string): number => {
  const data = readData(balancesPath);
  return data.users[userId]?.balance || 0;
};

export const updateUserBalance = (userId: string, amount: number): void => {
  const data = readData(balancesPath);
  if (!data.users[userId]) {
    data.users[userId] = { balance: 0, lastClaimed: 0, username: '' };
  }
  data.users[userId].balance += amount;
  writeData(balancesPath, data);
};

export const setLastClaimed = (userId: string, timestamp: number): void => {
  const data = readData(balancesPath);
  if (!data.users[userId]) {
    data.users[userId] = { balance: 0, lastClaimed: 0, username: '' };
  }
  data.users[userId].lastClaimed = timestamp;
  writeData(balancesPath, data);
};

export const getLastClaimed = (userId: string): number => {
  const data = readData(balancesPath);
  return data.users[userId]?.lastClaimed || 0;
};

export const initializeDataFiles = (): void => {
  const initialData: Data = { users: {} };
  if (!fs.existsSync(balancesPath)) {
    writeData(balancesPath, initialData);
  }
};

export { readData, writeData, balancesPath };
