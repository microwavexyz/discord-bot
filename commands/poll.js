const { SlashCommandBuilder, CommandInteraction, CommandInteractionOptionResolver, TextChannel, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Creates a poll')
    .addStringOption(option => option.setName('question').setDescription('The question for the poll').setRequired(true))
    .addStringOption(option => option.setName('options').setDescription('Comma-separated list of options for the poll').setRequired(true)),
  async execute(interaction) {
    const question = interaction.options.getString('question', true);
    const options = interaction.options.getString('options', true).split(',').map(opt => opt.trim());

    if (options.length < 2 || options.length > 10) {
      await interaction.reply({ content: 'Please provide between 2 and 10 options.', ephemeral: true });
      return;
    }

    const channel = interaction.channel;
    let pollDescription = '';
    const reactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

    options.forEach((option, index) => {
      pollDescription += `${reactions[index]} ${option}\n`;
    });

    const embed = new EmbedBuilder()
      .setTitle(question)
      .setDescription(pollDescription)
      .setColor(0x00FF00);

    try {
      const pollMessage = await channel.send({ embeds: [embed] });
      for (let i = 0; i < options.length; i++) {
        await pollMessage.react(reactions[i]);
      }

      await interaction.reply({ content: 'Poll created!', ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'There was an error creating the poll.', ephemeral: true });
    }
  },
};
