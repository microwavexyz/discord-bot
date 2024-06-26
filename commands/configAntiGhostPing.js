const { SlashCommandBuilder } = require('@discordjs/builders');
const AntiGhostPing = require('../models/AntiGhostPing');

const authorizedUsers = ['452636692537540608', 'USER_ID_2'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configantighostping')
    .setDescription('Configure the anti-ghost ping settings')
    .addBooleanOption(option => option.setName('enabled').setDescription('Enable or disable anti-ghost ping').setRequired(true)),

  async execute(interaction) {
    const userId = interaction.user.id;

    if (!authorizedUsers.includes(userId)) {
      await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      return;
    }

    const guildId = interaction.guild.id;
    const enabled = interaction.options.getBoolean('enabled');

    try {
      let settings = await AntiGhostPing.findOne({ guildId });

      if (!settings) {
        settings = new AntiGhostPing({
          guildId,
          enabled: enabled
        });
      } else {
        settings.enabled = enabled;
      }

      await settings.save();
      await interaction.reply(`Anti-ghost ping ${enabled ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
      console.error('Error configuring anti-ghost ping:', error);
      await interaction.reply({ content: 'There was an error configuring anti-ghost ping settings. Please try again later.', ephemeral: true });
    }
  },
};
