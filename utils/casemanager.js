const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/moderationCases.json');

class CaseManager {
  constructor() {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        this.cases = JSON.parse(data);
        if (!Array.isArray(this.cases)) {
          console.error('Data loaded is not an array, initializing as empty array.');
          this.cases = [];
        }
      } else {
        console.log('File does not exist, initializing as empty array.');
        this.cases = [];
      }
    } catch (error) {
      console.error('Error reading or parsing file:', error);
      this.cases = [];
    }
  }

  saveCases() {
    try {
      fs.writeFileSync(filePath, JSON.stringify(this.cases, null, 2), 'utf-8');
      console.log('Cases saved successfully.');
    } catch (error) {
      console.error('Error saving cases:', error);
    }
  }

  createCase(user, moderator, command, reason) {
    const caseNumber = this.cases.length + 1;
    const newCase = {
      caseNumber,
      user,
      moderator,
      command,
      timestamp: new Date().toISOString(),
      reason,
    };
    this.cases.push(newCase);
    this.saveCases();
    return caseNumber;
  }

  getCases() {
    return this.cases;
  }
}

const caseManager = new CaseManager();
module.exports = caseManager;
