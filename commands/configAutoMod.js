const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const AntiSpamSettings = require('../models/AntiSpamSettings');
const AntiGhostPing = require('../models/AntiGhostPing');
const AntiCaps = require('../models/AntiCaps');
const AntiSelfBot = require('../models/AntiSelfBot');
const AntiDiscord = require('../models/AntiDiscord');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Configure the auto moderation settings')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('configspam')
        .setDescription('Configure the anti-spam settings')
        .addIntegerOption(option =>
          option.setName('threshold')
            .setDescription('Number of messages to consider spam')
            .setRequired(true)
            .setMinValue(2)
            .setMaxValue(10)
        )
        .addIntegerOption(option =>
          option.setName('timeframe')
            .setDescription('Time frame for detecting spam in seconds')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(60)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('configghostping')
        .setDescription('Configure the anti-ghost ping settings')
        .addBooleanOption(option =>
          option.setName('enabled')
            .setDescription('Enable or disable anti-ghost ping')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('configcaps')
        .setDescription('Configure the anti-caps settings')
        .addBooleanOption(option =>
          option.setName('enabled')
            .setDescription('Enable or disable anti-caps')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('threshold')
            .setDescription('Percentage of caps to consider spam')
            .setRequired(true)
            .setMinValue(50)
            .setMaxValue(100)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('configselfbot')
        .setDescription('Configure the anti-selfbot settings')
        .addBooleanOption(option =>
          option.setName('enabled')
            .setDescription('Enable or disable anti-selfbot')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('configdiscord')
        .setDescription('Configure the anti-discord settings')
        .addBooleanOption(option =>
          option.setName('enabled')
            .setDescription('Enable or disable anti-discord')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const subcommand = interaction.options.getSubcommand();

    try {
      let settings, message;

      switch (subcommand) {
        case 'configspam':
          settings = await updateSettings(AntiSpamSettings, guildId, {
            threshold: interaction.options.getInteger('threshold'),
            timeFrame: interaction.options.getInteger('timeframe') * 1000 // Convert to milliseconds
          });
          message = `Anti-spam settings updated successfully!\nThreshold: ${settings.threshold} messages\nTimeframe: ${settings.timeFrame / 1000} seconds`;
          break;

        case 'configghostping':
          settings = await updateSettings(AntiGhostPing, guildId, {
            enabled: interaction.options.getBoolean('enabled')
          });
          message = `Anti-ghost ping ${settings.enabled ? 'enabled' : 'disabled'} successfully!`;
          break;

        case 'configcaps':
          settings = await updateSettings(AntiCaps, guildId, {
            enabled: interaction.options.getBoolean('enabled'),
            threshold: interaction.options.getInteger('threshold')
          });
          message = `Anti-caps ${settings.enabled ? 'enabled' : 'disabled'} successfully!\nThreshold: ${settings.threshold}%`;
          break;

        case 'configselfbot':
          settings = await updateSettings(AntiSelfBot, guildId, {
            enabled: interaction.options.getBoolean('enabled')
          });
          message = `Anti-selfbot ${settings.enabled ? 'enabled' : 'disabled'} successfully!`;
          break;

        case 'configdiscord':
          settings = await updateSettings(AntiDiscord, guildId, {
            enabled: interaction.options.getBoolean('enabled')
          });
          message = `Anti-discord ${settings.enabled ? 'enabled' : 'disabled'} successfully!`;
          break;
      }

      const embed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setTitle('🛡️ AutoMod Configuration Updated')
        .setDescription(message)
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error updating settings:', error);
      await interaction.reply({ content: 'There was an error updating the settings. Please try again later.', ephemeral: true });
    }
  },
};

async function updateSettings(Model, guildId, newSettings) {
  let settings = await Model.findOne({ guildId });

  if (!settings) {
    settings = new Model({ guildId, ...newSettings });
  } else {
    Object.assign(settings, newSettings);
  }

  return settings.save();
}