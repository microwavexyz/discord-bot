const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const caseManager = require('../utils/casemanager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kicks a user')
    .addUserOption(option => option.setName('target').setDescription('The user to kick').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for kicking')),
  async execute(interaction) {
    const options = interaction.options;
    const user = options.getUser('target', true);
    const reason = options.getString('reason') || 'No reason provided';
    const moderator = interaction.user;

    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Permission Denied')
        .setDescription('I do not have permission to kick users in this server.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.KickMembers)) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Permission Denied')
        .setDescription('You do not have permission to kick users in this server.');
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

      if (!member.kickable) {
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('Action Denied')
          .setDescription('I cannot kick this user due to role hierarchy.');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      const caseNumber = await caseManager.createCase(user.tag, moderator.tag, 'kick', reason);

      // Send DM to the user being kicked
      const dmEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setDescription(`You have been kicked from **${interaction.guild.name}**\n**Reason:** ${reason}\n**Moderator:** <@${moderator.id}>\n**Case Number:** ${caseNumber}`);

      try {
        await user.send({ embeds: [dmEmbed] });
      } catch (error) {
        console.error('Error sending DM:', error);
      }

      // Kick the user
      await member.kick(reason);

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setDescription(`✅ **<@${user.id}> kicked**\n**Reason:** ${reason}\n**Moderator:** <@${moderator.id}>`)
        .setFooter({ text: `Case Number: ${caseNumber}`, iconURL: interaction.client.user.displayAvatarURL() });

      await interaction.reply({ embeds: [embed], ephemeral: false });
    } catch (error) {
      console.error(error);
      if (!interaction.replied) {
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('Error')
          .setDescription('An error occurred while trying to kick the user.');
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },
};
