const { SlashCommandBuilder, CommandInteraction, PermissionsBitField, TextChannel } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clears a specified number of messages')
    .addIntegerOption(option => option.setName('amount').setDescription('The number of messages to clear').setRequired(true)),
  async execute(interaction) {
    const amount = interaction.options.getInteger('amount', true);
    const channel = interaction.channel;

    if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      await interaction.reply({ content: 'I do not have permission to manage messages in this channel.', ephemeral: true });
      return;
    }

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      await interaction.reply({ content: 'You do not have permission to manage messages in this channel.', ephemeral: true });
      return;
    }

    if (amount < 1 || amount > 100) {
      await interaction.reply({ content: 'Please enter a number between 1 and 100.', ephemeral: true });
      return;
    }

    try {
      const deletedMessages = await channel.bulkDelete(amount, true);
      await interaction.reply({ content: `Successfully deleted ${deletedMessages.size} messages.`, ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'There was an error trying to clear messages in this channel!', ephemeral: true });
    }
  },
};
