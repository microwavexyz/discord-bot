const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flips a coin and returns heads or tails'),
  async execute(interaction) {
    
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({ content: 'I need permission to send messages in this channel.', ephemeral: true });
    }

    
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';

    
    const embed = new EmbedBuilder()
      .setColor(0x00AE86)
      .setTitle('🪙 Coin Flip')
      .setDescription(`The coin landed on: **${result}**`)
      .setFooter({ text: 'Flipped by ' + interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    
    await interaction.reply({ embeds: [embed] });
  },
};
