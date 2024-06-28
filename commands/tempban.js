const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const caseManager = require('../utils/casemanager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tempban')
    .setDescription('Temporarily ban a user.')
    .addUserOption(option => 
      option.setName('target')
        .setDescription('The user to ban')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('duration')
        .setDescription('Duration of the ban in minutes')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false)),
  async execute(interaction) {
    const options = interaction.options;
    const target = options.getUser('target', true);
    const duration = options.getInteger('duration', true);
    const reason = options.getString('reason') || 'No reason provided';
    const moderator = interaction.user;

    if (target.id === interaction.user.id || target.id === interaction.client.user.id) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Invalid Target')
        .setDescription('You cannot ban yourself or the bot.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

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
      const caseNumber = await caseManager.createCase(target.tag, moderator.tag, 'tempban', reason);

      // Send DM to the user being tempbanned
      const dmEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setDescription(`You have been temporarily banned from **${interaction.guild.name}** for ${duration} minutes.\n**Reason:** ${reason}\n**Moderator:** <@${moderator.id}>\n**Case Number:** ${caseNumber}`);

      try {
        await target.send({ embeds: [dmEmbed] });
      } catch (error) {
        console.error('Error sending DM:', error);
      }

      // Temporarily ban the user
      await member.ban({ reason });

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setDescription(`✅ **<@${target.id}> temporarily banned for ${duration} minutes**\n**Reason:** ${reason}\n**Moderator:** <@${moderator.id}>`)
        .setFooter({ text: `Case Number: ${caseNumber}`, iconURL: interaction.client.user.displayAvatarURL() });

      await interaction.reply({ embeds: [embed], ephemeral: false });

      setTimeout(async () => {
        await interaction.guild?.members.unban(target.id, 'Temporary ban expired');
      }, duration * 60 * 1000);
    } catch (error) {
      console.error('Error banning the user:', error);
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Error')
        .setDescription('There was an error trying to ban the user.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};
