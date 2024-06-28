const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const caseManager = require('../utils/casemanager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unbans a user')
    .addUserOption(option => option.setName('target').setDescription('The user to unban').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for unbanning')),
  async execute(interaction) {
    const options = interaction.options;
    const user = options.getUser('target', true);
    const reason = options.getString('reason') || 'No reason provided';
    const moderator = interaction.user;

    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Permission Denied')
        .setDescription('I do not have permission to unban users in this server.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.BanMembers)) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Permission Denied')
        .setDescription('You do not have permission to unban users in this server.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    try {
      const ban = await interaction.guild.bans.fetch(user.id).catch(() => null);

      if (!ban) {
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('User Not Banned')
          .setDescription(`User with ID ${user.id} is not banned.`);
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      const caseNumber = await caseManager.createCase(user.tag, moderator.tag, 'unban', reason);

      // Send DM to the user being unbanned
      const dmEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setDescription(`You have been unbanned from **${interaction.guild.name}**\n**Reason:** ${reason}\n**Moderator:** <@${moderator.id}>\n**Case Number:** ${caseNumber}`);

      try {
        await user.send({ embeds: [dmEmbed] });
      } catch (error) {
        console.error('Error sending DM:', error);
      }

      await interaction.guild.bans.remove(user.id, reason);

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setDescription(`✅ **<@${user.id}> unbanned**\n**Reason:** ${reason}\n**Moderator:** <@${moderator.id}>`)
        .setFooter({ text: `Case Number: ${caseNumber}`, iconURL: interaction.client.user.displayAvatarURL() });

      await interaction.reply({ embeds: [embed], ephemeral: false });
    } catch (error) {
      if (error.code === 10026) {
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('User Not Banned')
          .setDescription(`User with ID ${user.id} is not banned.`);
        await interaction.reply({ embeds: [embed], ephemeral: true });
      } else {
        console.error(error);
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('Error')
          .setDescription('An error occurred while trying to unban the user.');
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },
};
