const { SlashCommandBuilder, CommandInteraction, Collection } = require('discord.js');

const afkUsers = new Collection();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Sets your AFK status')
    .addStringOption(option => option.setName('message').setDescription('AFK message').setRequired(true)),
  async execute(interaction) {
    const message = interaction.options.getString('message', true);
    afkUsers.set(interaction.user.id, message);

    await interaction.reply({ content: `You are now AFK: ${message}`, ephemeral: true });
  },
};
