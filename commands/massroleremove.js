const { SlashCommandBuilder, PermissionsBitField, GuildMember } = require('discord.js');
const ADMIN_ROLE_ID = 'ID'; 

module.exports = {
  data: new SlashCommandBuilder()
    .setName('massroleremove')
    .setDescription('Removes a specified role from multiple users.')
    .addRoleOption(option => 
      option.setName('role')
        .setDescription('The role to remove')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('user_ids')
        .setDescription('The IDs of the users to remove the role from, separated by commas')
        .setRequired(true)
    ),
  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
      return;
    }

    const member = interaction.member;

    if (!member.roles.cache.has(ADMIN_ROLE_ID)) {
      await interaction.reply({ content: 'You must have the Admin role to use this command.', ephemeral: true });
      return;
    }

    const options = interaction.options;
    const role = options.getRole('role', true);
    const userIdsString = options.getString('user_ids', true);
    const userIds = userIdsString.split(',').map(id => id.trim());

    const botMember = interaction.guild.members.me;
    if (!botMember?.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      await interaction.reply({ content: 'I do not have permission to manage roles.', ephemeral: true });
      return;
    }

    try {
      const failedRemovals = [];

      for (const userId of userIds) {
        const targetMember = await interaction.guild.members.fetch(userId).catch(() => null);

        if (targetMember && targetMember.roles.cache.has(role.id)) {
          await targetMember.roles.remove(role).catch(() => {
            failedRemovals.push(userId);
          });
        } else {
          failedRemovals.push(userId);
        }
      }

      if (failedRemovals.length > 0) {
        await interaction.reply({
          content: `Failed to remove the role from the following users: ${failedRemovals.join(', ')}.`,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: `Successfully removed the role from the specified users.`,
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error('Error removing roles:', error);
      await interaction.reply({ content: 'An error occurred while trying to remove roles.', ephemeral: true });
    }
  },
};
