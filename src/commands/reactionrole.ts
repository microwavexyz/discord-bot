import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField, EmbedBuilder, Role, TextChannel, MessageReaction, User, GuildMember } from 'discord.js';
import { Command } from '../types/command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Sets up a reaction role message')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The message to react to')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role to assign')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('emoji')
        .setDescription('The emoji to react with')
        .setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await sendEmbed(interaction, 0xff0000, 'This command can only be used in a guild.', true);
      return;
    }

    const member = interaction.member as GuildMember;
    if (!member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      await sendEmbed(interaction, 0xff0000, 'You do not have permission to use this command.', true);
      return;
    }

    const messageContent = interaction.options.getString('message', true);
    const role = interaction.options.getRole('role', true) as Role;
    const emoji = interaction.options.getString('emoji', true);

    if (!isValidEmoji(emoji)) {
      await sendEmbed(interaction, 0xff0000, 'Invalid emoji format. Please provide a valid emoji.', true);
      return;
    }

    const botMember = interaction.guild.members.me;
    if (!botMember?.permissions.has(PermissionsBitField.Flags.AddReactions)) {
      await sendEmbed(interaction, 0xff0000, 'I do not have permission to add reactions.', true);
      return;
    }

    const channel = interaction.channel as TextChannel;
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setDescription(`React to this message with ${emoji} to get the ${role.name} role.`);

    try {
      const msg = await channel.send({ embeds: [embed] });
      await msg.react(emoji);

      const filter = (reaction: MessageReaction, user: User) => reaction.emoji.name === emoji && !user.bot;
      const collector = msg.createReactionCollector({ filter, dispose: true });

      collector.on('collect', async (reaction, user) => handleRoleAssignment(interaction, role, user, 'add'));
      collector.on('remove', async (reaction, user) => handleRoleAssignment(interaction, role, user, 'remove'));

      await interaction.reply({ content: 'Reaction role message created.', ephemeral: true });
    } catch (error) {
      console.error('Failed to set up reaction role message', error);
      await sendEmbed(interaction, 0xff0000, 'Failed to set up the reaction role message. Please ensure the emoji is valid and available in this server.', true);
    }
  },
};

/**
 * Validates the emoji format.
 * @param emoji The emoji to validate.
 * @returns Whether the emoji format is valid.
 */
function isValidEmoji(emoji: string): boolean {
  const emojiRegex = /^<:\w+:(\d+)>$|^[\u0000-\uFFFF]+$/;
  return emojiRegex.test(emoji);
}

/**
 * Sends an embed as a reply to an interaction.
 * @param interaction The interaction object.
 * @param color The color of the embed.
 * @param description The description of the embed.
 * @param ephemeral Whether the reply should be ephemeral.
 */
async function sendEmbed(interaction: ChatInputCommandInteraction, color: number, description: string, ephemeral: boolean = false) {
  const embed = new EmbedBuilder().setColor(color).setDescription(description);
  await interaction.reply({ embeds: [embed], ephemeral });
}

/**
 * Handles role assignment or removal based on the reaction event.
 * @param interaction The interaction object.
 * @param role The role to assign or remove.
 * @param user The user reacting to the message.
 * @param action The action to perform ('add' or 'remove').
 */
async function handleRoleAssignment(interaction: ChatInputCommandInteraction, role: Role, user: User, action: 'add' | 'remove') {
  const guildMember = interaction.guild!.members.cache.get(user.id);
  if (guildMember) {
    try {
      if (action === 'add') {
        await guildMember.roles.add(role);
        console.log(`Role ${role.name} added to ${user.tag}`);
      } else {
        await guildMember.roles.remove(role);
        console.log(`Role ${role.name} removed from ${user.tag}`);
      }
    } catch (error) {
      console.error(`Failed to ${action} role ${role.name} for ${user.tag}`, error);
      await sendEmbed(interaction, 0xff0000, `Failed to ${action} the role for ${user.tag}. Please try again later.`, true);
    }
  }
}
