const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const caseManager = require('../utils/casemanager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmutes a user')
    .addUserOption(option => option.setName('target').setDescription('The user to unmute').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for unmuting')),
  async execute(interaction) {
    const options = interaction.options;
    const user = options.getUser('target', true);
    const reason = options.getString('reason') || 'No reason provided';
    const moderator = interaction.user;

    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Permission Denied')
        .setDescription('I do not have permission to manage roles in this server.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageRoles)) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Permission Denied')
        .setDescription('You do not have permission to manage roles in this server.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    try {
      const member = await interaction.guild?.members.fetch(user.id);
      if (!member) {
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('User Not Found')
          .setDescription('User not found in this server.');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      const caseNumber = await caseManager.createCase(user.tag, moderator.tag, 'unmute', reason);

      // Send DM to the user being unmuted
      const dmEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setDescription(`You have been unmuted in **${interaction.guild.name}**\n**Reason:** ${reason}\n**Moderator:** <@${moderator.id}>\n**Case Number:** ${caseNumber}`);

      try {
        await user.send({ embeds: [dmEmbed] });
      } catch (error) {
        console.error('Error sending DM:', error);
      }

      // Unmute the user
      await member.timeout(null, reason);

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setDescription(`✅ **<@${user.id}> unmuted**\n**Reason:** ${reason}\n**Moderator:** <@${moderator.id}>`)
        .setFooter({ text: `Case Number: ${caseNumber}`, iconURL: interaction.client.user.displayAvatarURL() });

      await interaction.reply({ embeds: [embed], ephemeral: false });
    } catch (error) {
      console.error(error);
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Error')
        .setDescription('An error occurred while trying to unmute the user.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
