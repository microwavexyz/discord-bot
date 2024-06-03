import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, TextChannel, PermissionsBitField } from 'discord.js';
import { Command } from '../types/command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send an announcement to a specified channel')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to send the announcement to')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The announcement message')
        .setRequired(true))
    .addUserOption(option =>
      option.setName('mentionuser')
        .setDescription('User to mention in the announcement')
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('mentionrole')
        .setDescription('Role to mention in the announcement')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('footer')
        .setDescription('Footer text for the announcement')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('thumbnail')
        .setDescription('Thumbnail URL for the announcement')
        .setRequired(false)),
  async execute(interaction: ChatInputCommandInteraction) {
    // Check if the user has the "ADMINISTRATOR" permission
    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
      await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      return;
    }

    const channel = interaction.options.getChannel('channel') as TextChannel;
    const message = interaction.options.getString('message')!;
    const mentionUser = interaction.options.getUser('mentionuser');
    const mentionRole = interaction.options.getRole('mentionrole');
    const footer = interaction.options.getString('footer') || '';
    const thumbnail = interaction.options.getString('thumbnail');

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('Announcement')
      .setDescription(message)
      .setTimestamp();

    if (footer) {
      embed.setFooter({ text: footer });
    }

    if (thumbnail) {
      if (isValidURL(thumbnail)) {
        embed.setThumbnail(thumbnail);
      } else {
        await interaction.reply({ content: 'Invalid thumbnail URL.', ephemeral: true });
        return;
      }
    }

    let content = '';
    if (mentionUser) content += `<@${mentionUser.id}> `;
    if (mentionRole) content += `<@&${mentionRole.id}>`;

    await channel.send({ content: content.trim(), embeds: [embed] });
    await interaction.reply({ content: 'Announcement sent!', ephemeral: true });
  },
};

function isValidURL(str: string): boolean {
  const pattern = new RegExp('^(https?:\\/\\/)?' + 
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|((\\d{1,3}\\.){3}\\d{1,3}))' +
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + 
    '(\\?[;&a-z\\d%_.~+=-]*)?' + 
    '(\\#[-a-z\\d_]*)?$', 'i');
  return !!pattern.test(str);
}
