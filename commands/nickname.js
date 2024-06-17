const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nickname')
    .setDescription('Changes the nickname of a user.')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to change the nickname of')
        .setRequired(true)
    )
    .addStringOption(option => 
      option.setName('nickname')
        .setDescription('The new nickname for the user')
        .setRequired(true)
    ),
  async execute(interaction) {
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
      return interaction.reply({ content: 'I need permission to manage nicknames in this server.', ephemeral: true });
    }

    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageNicknames)) {
      return interaction.reply({ content: 'You do not have permission to manage nicknames in this server.', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('user', true);
    const newNickname = interaction.options.getString('nickname', true);

    try {
      const member = await interaction.guild.members.fetch(targetUser.id);
      if (!member.manageable) {
        return interaction.reply({ content: 'I cannot change the nickname of this user due to role hierarchy.', ephemeral: true });
      }

      await member.setNickname(newNickname);

      const embed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setTitle('Nickname Changed')
        .setDescription(`Successfully changed nickname of ${targetUser.tag} to **${newNickname}**`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error changing nickname:', error);

      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Error')
        .setDescription('An error occurred while trying to change the nickname. Please try again later.')
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
