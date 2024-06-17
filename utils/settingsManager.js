// This is a mock implementation. Replace this with actual database logic if necessary.
const settings = {};

async function getSettings(guildId) {
  if (!settings[guildId]) {
    settings[guildId] = {
      automod: {
        anti_ghostping: true,
        anti_spam: true,
        anti_massmention: 3,
      },
    };
  }
  return settings[guildId];
}

async function saveSettings(guildId, newSettings) {
  settings[guildId] = newSettings;
  // Implement actual save logic here if necessary, e.g., saving to a database
  console.log(`Settings for guild ${guildId} saved:`, newSettings);
}

module.exports = {
  getSettings,
  saveSettings,
};
