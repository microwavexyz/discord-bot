// utils/dataStorage.ts
import fs from 'fs';
import path from 'path';

const dataPath = path.join(__dirname, '..', 'data');

export const readData = (fileName: string) => {
  const filePath = path.join(dataPath, `${fileName}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
};

export const writeData = (fileName: string, data: any) => {
  const filePath = path.join(dataPath, `${fileName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};
