const { SlashCommandBuilder, CommandInteraction } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invitelink')
    .setDescription('Provides an invite link for the bot'),
  async execute(interaction) {
    if (!interaction.client.user) {
      await interaction.reply({ content: 'Could not generate invite link. Please try again later.', ephemeral: true });
      return;
    }

    const inviteLink = `https://discord.com/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot%20applications.commands`;
    await interaction.reply({ content: `Invite me to your server using this link: [Invite Link](${inviteLink})`, ephemeral: true });
  },
};
