const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dm')
    .setDescription('Sends a direct message to a user')
    .addUserOption(option => option.setName('user').setDescription('The user to send a DM to').setRequired(true))
    .addStringOption(option => option.setName('message').setDescription('The message to send').setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages | PermissionsBitField.Flags.ModerateMembers),

  async execute(interaction) {
    // Check if the user has the required permissions
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages) || 
        !interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      return;
    }

    // Check if the user is an administrator or has a specific role
    const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
    const hasModRole = interaction.member.roles.cache.some(role => role.name === 'Moderator'); // Replace 'Moderator' with your specific role name

    if (!isAdmin && !hasModRole) {
      await interaction.reply({ content: 'This command is restricted to administrators and moderators.', ephemeral: true });
      return;
    }

    const user = interaction.options.getUser('user', true);
    const message = interaction.options.getString('message', true);

    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.SendMessages)) {
      await interaction.reply({ content: 'I need permission to send messages in this server.', ephemeral: true });
      return;
    }

    // Check if the target user is a bot
    if (user.bot) {
      await interaction.reply({ content: 'You cannot send DMs to bot accounts.', ephemeral: true });
      return;
    }

    try {
      await user.send(message);
      await interaction.reply({ content: `Sent a DM to ${user.tag}: ${message}`, ephemeral: true });

      // Log the DM action to a specific channel
      const logChannel = interaction.guild.channels.cache.find(channel => channel.name === 'mod-logs');
      if (logChannel) {
        await logChannel.send(`${interaction.user.tag} sent a DM to ${user.tag}: ${message}`);
      }
    } catch (error) {
      console.error(error);

      let errorMessage = 'Could not send a DM. The user might have DMs disabled or blocked the bot.';

      if (error.code === 50007) { 
        errorMessage = 'Could not send a DM. The user has DMs disabled or has blocked the bot.';
      }

      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  },
}