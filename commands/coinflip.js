const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flips a coin and returns heads or tails'),

  async execute(interaction) {
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({ embeds: [createErrorEmbed('Permission Denied', 'I need permission to send messages in this channel.')], ephemeral: true });
    }

    await interaction.deferReply();

    // Simulate a coin flip animation
    const flipEmbed = new EmbedBuilder()
      .setColor(0xFFA500)
      .setTitle('🪙 Flipping Coin...')
      .setDescription('The coin is in the air!')
      .setFooter({ text: `Flipped by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

    const flipMessage = await interaction.editReply({ embeds: [flipEmbed] });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    const resultEmoji = result === 'Heads' ? '🦅' : '🐍'; 

    const resultEmbed = new EmbedBuilder()
      .setColor(result === 'Heads' ? 0xFFD700 : 0xC0C0C0)
      .setTitle(`${resultEmoji} Coin Flip Result`)
      .setDescription(`The coin landed on: **${result}**`)
      .addFields(
        { name: 'Flipped by', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Result', value: `${resultEmoji} ${result}`, inline: true }
      )
      .setFooter({ text: `Flip ID: ${Date.now().toString(36)}`, iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp();

    await flipMessage.edit({ embeds: [resultEmbed] });
  },
};

function createErrorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0xE74C3C)
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setTimestamp();
}