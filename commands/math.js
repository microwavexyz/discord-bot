const { SlashCommandBuilder, CommandInteraction, CommandInteractionOptionResolver } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('math')
    .setDescription('Performs basic arithmetic operations')
    .addNumberOption(option => option.setName('num1').setDescription('First number').setRequired(true))
    .addStringOption(option => option.setName('operation').setDescription('Operation (add, subtract, multiply, divide)').setRequired(true))
    .addNumberOption(option => option.setName('num2').setDescription('Second number').setRequired(true)),
  async execute(interaction) {
    const num1 = interaction.options.getNumber('num1', true);
    const operation = interaction.options.getString('operation', true);
    const num2 = interaction.options.getNumber('num2', true);

    let result;
    switch (operation.toLowerCase()) {
      case 'add':
        result = num1 + num2;
        break;
      case 'subtract':
        result = num1 - num2;
        break;
      case 'multiply':
        result = num1 * num2;
        break;
      case 'divide':
        if (num2 === 0) {
          await interaction.reply({ content: 'Cannot divide by zero.', ephemeral: true });
          return;
        }
        result = num1 / num2;
        break;
      default:
        await interaction.reply({ content: 'Invalid operation. Please use add, subtract, multiply, or divide.', ephemeral: true });
        return;
    }

    await interaction.reply({ content: `Result: ${result}` });
  },
};
