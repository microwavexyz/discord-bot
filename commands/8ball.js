const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

const cooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Answers a yes/no question')
    .addStringOption(option => 
      option.setName('question')
        .setDescription('The question to answer')
        .setRequired(true)
    ),
  async execute(interaction) {
    
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({ content: 'I need permission to send messages in this channel.', ephemeral: true });
    }

   
    const cooldownAmount = 5000; 
    if (!cooldowns.has(interaction.commandName)) {
      cooldowns.set(interaction.commandName, new Map());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(interaction.commandName);
    const cooldown = timestamps.get(interaction.user.id);

    if (cooldown) {
      const expirationTime = cooldown + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return interaction.reply({ content: `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${interaction.commandName}\` command.`, ephemeral: true });
      }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    // Array of possible answers
    const answers = [
      'Yes',
      'No',
      'Maybe',
      'Definitely',
      'Absolutely not',
      'I don\'t think so',
      'It is certain',
      'Very doubtful',
      'Ask again later',
      'Cannot predict now'
    ];

    
    const question = interaction.options.getString('question', true);
    const answer = answers[Math.floor(Math.random() * answers.length)];

    
    const embed = new EmbedBuilder()
      .setColor(0x00AE86)
      .setTitle('🎱 8ball')
      .addFields(
        { name: 'Question', value: question },
        { name: 'Answer', value: `**${answer}**` }
      )
      .setFooter({ text: `Asked by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    
    await interaction.reply({ embeds: [embed] });
  },
};
