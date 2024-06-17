const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rps')
    .setDescription('Play Rock Paper Scissors')
    .addStringOption(option => 
      option.setName('choice')
        .setDescription('Rock, Paper, or Scissors')
        .setRequired(true)
        .addChoices(
          { name: 'Rock', value: 'rock' },
          { name: 'Paper', value: 'paper' },
          { name: 'Scissors', value: 'scissors' }
        )
    ),
  async execute(interaction) {
    // Permissions check: ensure the bot has permission to send messages
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({ content: 'I need permission to send messages in this channel.', ephemeral: true });
    }

    // Fetch the user's choice
    const userChoice = interaction.options.getString('choice', true);

    const choices = ['rock', 'paper', 'scissors'];
    const botChoice = choices[Math.floor(Math.random() * choices.length)];
    let result = '';

    if (userChoice === botChoice) {
      result = 'It\'s a tie!';
    } else if ((userChoice === 'rock' && botChoice === 'scissors') ||
               (userChoice === 'paper' && botChoice === 'rock') ||
               (userChoice === 'scissors' && botChoice === 'paper')) {
      result = 'You win!';
    } else {
      result = 'You lose!';
    }

    // Create an embed for a visually appealing response
    const embed = new EmbedBuilder()
      .setColor(0x00AE86)
      .setTitle('Rock Paper Scissors')
      .addFields(
        { name: 'Your Choice', value: userChoice.charAt(0).toUpperCase() + userChoice.slice(1), inline: true },
        { name: 'Bot\'s Choice', value: botChoice.charAt(0).toUpperCase() + botChoice.slice(1), inline: true },
        { name: 'Result', value: result }
      )
      .setFooter({ text: 'Thanks for playing!', iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
