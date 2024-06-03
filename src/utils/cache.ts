import fs from 'fs';
import path from 'path';

export class Cache {
  private data: any;
  private dataPath: string;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor(dataFile: string) {
    this.dataPath = path.join(__dirname, '../data', dataFile);
    this.loadData();
  }

  private loadData() {
    try {
      this.data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
    } catch (error) {
      if (error instanceof Error) {
        if ((error as any).code === 'ENOENT') {
          // File does not exist, create it with initial structure
          this.data = { users: {} };
          this.saveData();
        } else {
          throw error;
        }
      } else {
        console.error('Unexpected error type:', error);
      }
    }
  }

  public getData() {
    return this.data;
  }

  public setData(newData: any) {
    this.data = newData;
    this.scheduleSave();
  }

  private scheduleSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => this.saveData(), 5000); // Save after 5 seconds of inactivity
  }

  private saveData() {
    fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
  }
}
