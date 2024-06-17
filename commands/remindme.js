const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remindme')
    .setDescription('Sets a reminder')
    .addStringOption(option => 
      option.setName('time')
        .setDescription('Time until reminder (e.g., 10s, 5m, 2h)')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('message')
        .setDescription('Reminder message')
        .setRequired(true)),
  async execute(interaction) {
    const time = interaction.options.getString('time', true);
    const message = interaction.options.getString('message', true);

    const timeUnits = {
      s: 1000,
      m: 1000 * 60,
      h: 1000 * 60 * 60,
      d: 1000 * 60 * 60 * 24
    };

    const unit = time.slice(-1).toLowerCase();
    const amount = parseInt(time.slice(0, -1));

    if (!timeUnits[unit] || isNaN(amount)) {
      await interaction.reply({ content: 'Invalid time format. Use s, m, h, or d for seconds, minutes, hours, or days respectively.', ephemeral: true });
      return;
    }

    const delay = amount * timeUnits[unit];

    await interaction.reply({ content: `Reminder set for ${time}: ${message}`, ephemeral: true });

    setTimeout(() => {
      interaction.user.send(`Reminder: ${message}`).catch(error => {
        console.error('Failed to send reminder:', error);
      });
    }, delay);
  },
};
