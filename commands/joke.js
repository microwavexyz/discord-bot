const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Tells a random joke'),
  async execute(interaction) {
    
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({ content: 'I need permission to send messages in this channel.', ephemeral: true });
    }

    try {
      const response = await fetch('https://official-joke-api.appspot.com/jokes/random');
      const joke = await response.json();

      const embed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setTitle('😂 Random Joke')
        .setDescription(`${joke.setup}\n\n**${joke.punchline}**`)
        .setFooter({ text: 'Joke provided by official-joke-api.appspot.com' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching joke:', error);
      return interaction.reply({ content: 'Sorry, I couldn\'t fetch a joke right now. Please try again later.', ephemeral: true });
    }
  },
};
