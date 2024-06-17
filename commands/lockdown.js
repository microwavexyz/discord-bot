const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

// In-memory storage for original permissions
const originalPermissions = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Locks the server, preventing users from sending messages and hiding channels'),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      await interaction.reply({ content: 'You do not have permission to lock the server.', ephemeral: true });
      return;
    }

    try {
      const guild = interaction.guild;
      const owner = await guild.fetchOwner();
      const channels = guild.channels.cache;
      const everyoneRole = guild.roles.everyone;

      for (const [channelId, channel] of channels) {
        if (channel.type === 'GUILD_TEXT' || channel.type === 'GUILD_VOICE') {
          const originalPerms = channel.permissionOverwrites.cache.map(overwrite => ({
            id: overwrite.id,
            allow: overwrite.allow.bitfield,
            deny: overwrite.deny.bitfield,
          }));
          originalPermissions.set(channelId, originalPerms);

          await channel.permissionOverwrites.set([
            {
              id: everyoneRole.id,
              deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: owner.id,
              allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel],
            },
          ]);

          
          if (channel.name !== 'announcements') {
            await channel.permissionOverwrites.edit(everyoneRole, {
              VIEW_CHANNEL: false,
            });
          }
        }
      }

      await interaction.reply({ content: 'Server is in lockdown mode.', ephemeral: true });
    } catch (error) {
      console.error('Error locking down the server:', error);
      await interaction.reply({ content: 'There was an error trying to lock down the server.', ephemeral: true });
    }
  },
};

// Export the originalPermissions for unlock.js to use
module.exports.originalPermissions = originalPermissions;
