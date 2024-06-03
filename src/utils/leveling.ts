import fs from 'fs';
import path from 'path';

const dataPath = path.join(__dirname, '../data/levels.json');

interface UserLevelData {
  xp: number;
  level: number;
}

interface LevelData {
  users: {
    [key: string]: UserLevelData;
  };
}

let levelData: LevelData;

// Save level data to the JSON file
const saveLevelData = () => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(levelData, null, 2));
  } catch (error) {
    console.error('Error saving levels.json:', error);
  }
};

// Load level data from the JSON file
try {
  levelData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} catch (error) {
  if ((error as any).code === 'ENOENT') {
    // If the file doesn't exist, initialize with an empty structure
    levelData = { users: {} };
    saveLevelData();
  } else {
    console.error('Error reading levels.json:', error);
    throw error;
  }
}

// Get user level data, initializing if necessary
export const getUserLevelData = (userId: string): UserLevelData => {
  if (!levelData.users[userId]) {
    levelData.users[userId] = { xp: 0, level: 1 };
  }
  return levelData.users[userId];
};

// Add XP to a user's level data
export const addXP = (userId: string, xp: number): boolean => {
  const userData = getUserLevelData(userId);
  userData.xp += xp;

  let leveledUp = false;
  const xpToNextLevel = getXpToNextLevel(userData.level);

  while (userData.xp >= xpToNextLevel) {
    userData.xp -= xpToNextLevel;
    userData.level += 1;
    leveledUp = true;
  }

  saveLevelData();
  return leveledUp;
};

// Calculate XP needed for next level
const getXpToNextLevel = (level: number): number => {
  return level * 100; // Example formula: XP required for next level increases by 100 for each level
};
