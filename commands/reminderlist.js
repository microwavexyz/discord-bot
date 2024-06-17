const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const reminders = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reminderlist')
    .setDescription('Lists all reminders set by the user'),
  async execute(interaction) {
    const userReminders = reminders.get(interaction.user.id) || [];

    if (userReminders.length === 0) {
      await interaction.reply({ content: 'You have no reminders set.', ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('Your Reminders')
      .setDescription(
        userReminders
          .map(reminder => {
            const timeLeft = reminder.time - Date.now();
            const hours = Math.floor(timeLeft / (1000 * 60 * 60)).toString().padStart(2, '0');
            const minutes = (Math.floor(timeLeft / (1000 * 60)) % 60).toString().padStart(2, '0');
            const seconds = (Math.floor(timeLeft / 1000) % 60).toString().padStart(2, '0');
            return `In ${hours}:${minutes}:${seconds}: ${reminder.message}`;
          })
          .join('\n')
      )
      .setColor(0x00FF00);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
