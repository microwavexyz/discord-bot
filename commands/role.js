const { SlashCommandBuilder, PermissionsBitField, Role } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Assigns or removes a role from a user')
    .addSubcommand(subcommand =>
      subcommand
        .setName('assign')
        .setDescription('Assigns a role to a user')
        .addUserOption(option => option.setName('user').setDescription('The user to assign the role to').setRequired(true))
        .addRoleOption(option => option.setName('role').setDescription('The role to assign').setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Removes a role from a user')
        .addUserOption(option => option.setName('user').setDescription('The user to remove the role from').setRequired(true))
        .addRoleOption(option => option.setName('role').setDescription('The role to remove').setRequired(true))),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const user = interaction.options.getUser('user', true);
    const role = interaction.options.getRole('role', true);


    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      await interaction.reply({ content: 'I do not have permission to manage roles in this server.', ephemeral: true });
      return;
    }


    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageRoles)) {
      await interaction.reply({ content: 'You do not have permission to manage roles in this server.', ephemeral: true });
      return;
    }

    const member = await interaction.guild?.members.fetch(user.id);

    if (!member) {
      await interaction.reply({ content: 'User not found in this server.', ephemeral: true });
      return;
    }

    try {
      if (subcommand === 'assign') {
        await member.roles.add(role);
        await interaction.reply({ content: `Successfully assigned ${role.name} to ${user.tag}.`, ephemeral: true });
      } else if (subcommand === 'remove') {
        await member.roles.remove(role);
        await interaction.reply({ content: `Successfully removed ${role.name} from ${user.tag}.`, ephemeral: true });
      }
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: `There was an error trying to ${subcommand} the role!`, ephemeral: true });
    }
  },
};
