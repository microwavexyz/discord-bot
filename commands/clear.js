const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clears a specified number of messages')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('The number of messages to clear')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)),
  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const channel = interaction.channel;

    if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ embeds: [createErrorEmbed('Permission Denied', 'I do not have permission to manage messages in this channel.')], ephemeral: true });
    }

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ embeds: [createErrorEmbed('Permission Denied', 'You do not have permission to manage messages in this channel.')], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const messages = await channel.messages.fetch({ limit: amount });
      const filteredMessages = messages.filter(msg => !msg.pinned);
      const deletedMessages = await channel.bulkDelete(filteredMessages, true);

      const embed = new EmbedBuilder()
        .setColor(0x4CAF50)
        .setTitle('🧹 Messages Cleared')
        .setDescription(`Successfully deleted ${deletedMessages.size} message${deletedMessages.size === 1 ? '' : 's'}.`)
        .addFields(
          { name: 'Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setFooter({ text: `${messages.size - deletedMessages.size} message${messages.size - deletedMessages.size === 1 ? ' was' : 's were'} not deleted (pinned or too old)` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.editReply({ embeds: [createErrorEmbed('Error', 'There was an error trying to clear messages in this channel!')], ephemeral: true });
    }
  },
};

function createErrorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0xE74C3C)
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setTimestamp();
}
