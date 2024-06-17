const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('emojiinfo')
    .setDescription('Displays information about an emoji')
    .addStringOption(option => option.setName('emoji').setDescription('The emoji to get information about').setRequired(true)),
  async execute(interaction) {
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({ content: 'I need permission to send messages in this channel.', ephemeral: true });
    }

    const emojiInput = interaction.options.getString('emoji', true);
    const emoji = interaction.guild?.emojis.cache.find(e => e.toString() === emojiInput || e.name === emojiInput);

    if (!emoji) {
      await interaction.reply({ content: 'Could not find the specified emoji.', ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`Emoji Info: ${emoji.name}`)
      .setThumbnail(emoji.url)
      .addFields(
        { name: 'ID', value: emoji.id, inline: true },
        { name: 'Name', value: emoji.name || 'Unknown', inline: true },
        { name: 'Animated', value: emoji.animated ? 'Yes' : 'No', inline: true },
        { name: 'Created At', value: emoji.createdAt.toDateString(), inline: true }
      )
      .setColor(0x00FF00)
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
