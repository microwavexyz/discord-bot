const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const caseManager = require('../utils/casemanager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('softban')
    .setDescription('Softban a user (ban and unban to remove messages).')
    .addUserOption(option => 
      option.setName('target')
        .setDescription('The user to softban')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Reason for the softban')
        .setRequired(false)),
  async execute(interaction) {
    const options = interaction.options;
    const target = options.getUser('target', true);
    const reason = options.getString('reason') || 'No reason provided';
    const moderator = interaction.user;

    const member = await interaction.guild?.members.fetch(target.id).catch(() => null);

    if (!member) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('User Not Found')
        .setDescription('User not found in the server.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.BanMembers)) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Permission Denied')
        .setDescription('You do not have permission to ban members.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    try {
      const caseNumber = await caseManager.createCase(target.tag, moderator.tag, 'softban', reason);

      // Send DM to the user being softbanned
      const dmEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setDescription(`You have been softbanned from **${interaction.guild.name}**\n**Reason:** ${reason}\n**Moderator:** <@${moderator.id}>\n**Case Number:** ${caseNumber}`);

      try {
        await target.send({ embeds: [dmEmbed] });
      } catch (error) {
        console.error('Error sending DM:', error);
      }

      // Softban the user
      await member.ban({ reason, deleteMessageDays: 7 });
      await interaction.guild?.members.unban(target.id, 'Softban');

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setDescription(`✅ **<@${target.id}> softbanned**\n**Reason:** ${reason}\n**Moderator:** <@${moderator.id}>`)
        .setFooter({ text: `Case Number: ${caseNumber}`, iconURL: interaction.client.user.displayAvatarURL() });

      await interaction.reply({ embeds: [embed], ephemeral: false });
    } catch (error) {
      console.error('Error softbanning the user:', error);
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Error')
        .setDescription('There was an error trying to softban the user.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};
