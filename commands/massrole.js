const { SlashCommandBuilder, CommandInteraction, GuildMemberRoleManager, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('massrole')
    .setDescription('Mass assign or remove a role')
    .addSubcommand(subcommand =>
      subcommand
        .setName('assign')
        .setDescription('Assign a role to all members')
        .addRoleOption(option =>
          option.setName('role')
                .setDescription('The role to assign')
                .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a role from all members')
        .addRoleOption(option =>
          option.setName('role')
                .setDescription('The role to remove')
                .setRequired(true))),
  async execute(interaction) {
    const options = interaction.options;
    const role = options.getRole('role', true);
    const members = await interaction.guild.members.fetch();

    if (!role || !members) {
      await interaction.reply({ content: 'Role or members not found.', ephemeral: true });
      return;
    }

    if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      await interaction.reply({ content: 'I do not have permission to manage roles in this server.', ephemeral: true });
      return;
    }

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      await interaction.reply({ content: 'You do not have permission to manage roles in this server.', ephemeral: true });
      return;
    }

    const subcommand = options.getSubcommand();

    try {
      if (subcommand === 'assign') {
        await Promise.all(members.map(member => 
          member.roles.add(role)
        ));
        await interaction.reply({ content: `Assigned role ${role.name} to all members.`, ephemeral: true });
      } else if (subcommand === 'remove') {
        await Promise.all(members.map(member => 
          member.roles.remove(role)
        ));
        await interaction.reply({ content: `Removed role ${role.name} from all members.`, ephemeral: true });
      } else {
        await interaction.reply({ content: 'Invalid subcommand.', ephemeral: true });
      }
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'There was an error processing the role changes.', ephemeral: true });
    }
  },
};
