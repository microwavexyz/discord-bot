const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const caseManager = require('../utils/casemanager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Displays warnings for a user')
    .addUserOption(option => option.setName('user').setDescription('The user to display warnings for').setRequired(false))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers),

  async execute(interaction) {
    // Check if the user has permission to view warnings
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Permission Denied')
        .setDescription('You do not have permission to view warnings.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const user = interaction.options.getUser('user') || interaction.user;

    // Check if the bot has necessary permissions
    if (!interaction.guild?.members.me?.permissions.has([PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.EmbedLinks])) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Permission Denied')
        .setDescription('I do not have the required permissions to view warnings and send embeds in this server.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    try {
      const warnings = await caseManager.getWarnings(user.id);

      if (!warnings || warnings.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('No Warnings')
          .setDescription(`${user.tag} has no warnings.`);
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`Warnings for ${user.tag}`)
        .setColor(0xFFA500)
        .setDescription(warnings.map((warn, index) => `**${index + 1}.** ${warn.reason} - ${new Date(warn.date).toLocaleDateString()}`).join('\n'))
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });

      // Log the action
      const logChannel = interaction.guild.channels.cache.find(channel => channel.name === 'mod-logs');
      if (logChannel) {
        await logChannel.send(`${interaction.user.tag} viewed warnings for ${user.tag}.`);
      }
    } catch (error) {
      console.error('Error retrieving warnings:', error);
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Error')
        .setDescription('There was an error trying to retrieve warnings.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};