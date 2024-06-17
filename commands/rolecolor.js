const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rolecolor')
    .setDescription('Changes the color of a specified role')
    .addRoleOption(option => option.setName('role').setDescription('The role to change color for').setRequired(true))
    .addStringOption(option => option.setName('color').setDescription('The new color for the role (hex code)').setRequired(true)),
  async execute(interaction) {
    const role = interaction.options.getRole('role', true);
    const color = interaction.options.getString('color', true);

    const isValidHexColor = /^#[0-9A-F]{6}$/i.test(color);

    if (!isValidHexColor) {
      await interaction.reply({ content: 'Invalid color format. Please provide a valid hex color code (e.g., #FFFFFF).', ephemeral: true });
      return;
    }

    
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      await interaction.reply({ content: 'I do not have permission to manage roles in this server.', ephemeral: true });
      return;
    }


    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageRoles)) {
      await interaction.reply({ content: 'You do not have permission to manage roles in this server.', ephemeral: true });
      return;
    }

    if (!role.editable) {
      await interaction.reply({ content: 'I cannot change the color of this role due to role hierarchy.', ephemeral: true });
      return;
    }

    try {
      await role.setColor(color);
      await interaction.reply({ content: `Changed color of ${role.name} to ${color}.` });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Could not change role color. Please try again.', ephemeral: true });
    }
  },
};
