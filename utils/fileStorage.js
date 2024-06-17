const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/userWarnings.json');

function readUserWarnings() {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const data = fs.readFileSync(filePath);
  return JSON.parse(data);
}

function writeUserWarnings(userWarnings) {
  fs.writeFileSync(filePath, JSON.stringify(userWarnings, null, 2));
}

module.exports = { readUserWarnings, writeUserWarnings };
