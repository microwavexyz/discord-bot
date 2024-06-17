const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dm')
    .setDescription('Sends a direct message to a user')
    .addUserOption(option => option.setName('user').setDescription('The user to send a DM to').setRequired(true))
    .addStringOption(option => option.setName('message').setDescription('The message to send').setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const message = interaction.options.getString('message', true);

    
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.SendMessages)) {
      await interaction.reply({ content: 'I need permission to send messages in this server.', ephemeral: true });
      return;
    }

    try {
      await user.send(message);
      await interaction.reply({ content: `Sent a DM to ${user.tag}: ${message}`, ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Could not send a DM. The user might have DMs disabled or blocked the bot.', ephemeral: true });
    }
  },
};
