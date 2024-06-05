import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, PermissionsBitField, EmbedBuilder, Role } from 'discord.js';
import { Command } from '../types/command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Manages roles for a user')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Adds a role to a user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The user to add the role to')
            .setRequired(true))
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('The role to add')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Removes a role from a user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The user to remove the role from')
            .setRequired(true))
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('The role to remove')
            .setRequired(true))),
  async execute(interaction: ChatInputCommandInteraction) {
    // Ensure the command is used in a guild
    if (!interaction.guild) {
      await sendEmbed(interaction, 0xff0000, 'This command can only be used in a guild.', true);
      return;
    }

    const member = interaction.member as GuildMember;
    // Check if the user has permission to manage roles
    if (!member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      await sendEmbed(interaction, 0xff0000, 'You do not have permission to use this command.', true);
      return;
    }

    const botMember = interaction.guild.members.me;
    // Check if the bot has permission to manage roles
    if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      await sendEmbed(interaction, 0xff0000, 'I do not have permission to manage roles.', true);
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    const user = interaction.options.getMember('user') as GuildMember;
    const role = interaction.options.getRole('role') as Role;

    // Validate user and role
    if (!user || !role) {
      await sendEmbed(interaction, 0xff0000, 'User or role not found.', true);
      return;
    }

    const embed = new EmbedBuilder();

    try {
      if (subcommand === 'add') {
        if (user.roles.cache.has(role.id)) {
          embed.setColor(0xffa500).setDescription(`User ${user.user.tag} already has the role ${role.name}.`);
        } else {
          await user.roles.add(role);
          embed.setColor(0x00ff00).setDescription(`Added role ${role.name} to ${user.user.tag}.`);
        }
      } else if (subcommand === 'remove') {
        if (!user.roles.cache.has(role.id)) {
          embed.setColor(0xffa500).setDescription(`User ${user.user.tag} does not have the role ${role.name}.`);
        } else {
          await user.roles.remove(role);
          embed.setColor(0x00ff00).setDescription(`Removed role ${role.name} from ${user.user.tag}.`);
        }
      }
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error managing role:', error);
      embed.setColor(0xff0000).setDescription('There was an error while managing the role.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

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
