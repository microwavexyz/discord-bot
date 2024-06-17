const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { originalPermissions } = require('./lockdown'); // Import the original permissions from lockdown.js

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlocks the server, restoring previous permissions'),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      await interaction.reply({ content: 'You do not have permission to unlock the server.', ephemeral: true });
      return;
    }

    try {
      const guild = interaction.guild;
      const channels = guild.channels.cache;

      for (const [channelId, channel] of channels) {
        if (channel.type === 'GUILD_TEXT' || channel.type === 'GUILD_VOICE') {
          const originalPerms = originalPermissions.get(channelId);
          if (!originalPerms) continue;

          // Restore original permissions
          await channel.permissionOverwrites.set(originalPerms);
        }
      }

      await interaction.reply({ content: 'Server is no longer in lockdown mode. Previous permissions have been restored.', ephemeral: true });
    } catch (error) {
      console.error('Error unlocking the server:', error);
      await interaction.reply({ content: 'There was an error trying to unlock the server.', ephemeral: true });
    }
  },
};
