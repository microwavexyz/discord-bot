const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('channelinfo')
    .setDescription('Displays detailed information about a channel')
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription('The channel to get information about')
        .setRequired(false)),

  async execute(interaction) {
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({ embeds: [createErrorEmbed('Permission Denied', 'I need permission to send messages in this channel.')], ephemeral: true });
    }

    const channel = interaction.options.getChannel('channel') || interaction.channel;

    const channelTypeMap = {
      [ChannelType.GuildText]: '💬 Text',
      [ChannelType.GuildVoice]: '🔊 Voice',
      [ChannelType.GuildCategory]: '📁 Category',
      [ChannelType.GuildAnnouncement]: '📢 Announcement',
      [ChannelType.GuildStageVoice]: '🎭 Stage',
      [ChannelType.GuildForum]: '🗣️ Forum',
      [ChannelType.GuildPublicThread]: '🧵 Public Thread',
      [ChannelType.GuildPrivateThread]: '🔒 Private Thread',
      [ChannelType.GuildNewsThread]: '📰 News Thread',
    };

    const createdTimestamp = Math.floor(channel.createdAt.getTime() / 1000);

    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle(`📊 Channel Info: ${channel.name}`)
      .setDescription(`<#${channel.id}>`)
      .addFields(
        { name: 'ID', value: `\`${channel.id}\``, inline: true },
        { name: 'Type', value: channelTypeMap[channel.type] || 'Unknown', inline: true },
        { name: 'Category', value: channel.parent ? `${channel.parent.name}` : 'None', inline: true },
        { name: 'Topic', value: channel.topic || 'No topic set', inline: false },
        { name: 'NSFW', value: channel.nsfw ? '🔞 Yes' : '✅ No', inline: true },
        { name: 'Position', value: `${channel.position + 1}`, inline: true },
        { name: 'Created', value: `<t:${createdTimestamp}:R>`, inline: true }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement) {
      embed.addFields(
        { name: 'Slowmode', value: channel.rateLimitPerUser ? `${channel.rateLimitPerUser} seconds` : 'Disabled', inline: true },
        { name: 'Messages', value: `${await channel.messages.fetch({ limit: 1 }).then(msgs => msgs.first()?.id ? BigInt('18446744073709551615') - BigInt(msgs.first().id) + BigInt(1) : 'Unknown')}`, inline: true }
      );
    } else if (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) {
      embed.addFields(
        { name: 'Bitrate', value: `${channel.bitrate / 1000}kbps`, inline: true },
        { name: 'User Limit', value: channel.userLimit ? `${channel.userLimit}` : 'Unlimited', inline: true }
      );
    }

    await interaction.reply({ embeds: [embed] });
  },
};

function createErrorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0xE74C3C)
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setTimestamp();
}