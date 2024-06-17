const { SlashCommandBuilder, PermissionsBitField, ChannelType, EmbedBuilder } = require('discord.js');
const { ReactionRoleManager } = require('../utils/casemanager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Sets up a reaction role message')
    .addStringOption(option => 
      option
        .setName('message')
        .setDescription('The message ID to react to')
        .setRequired(true)
    )
    .addStringOption(option => 
      option
        .setName('emoji')
        .setDescription('The emoji to react with')
        .setRequired(true)
    )
    .addRoleOption(option => 
      option
        .setName('role')
        .setDescription('The role to assign')
        .setRequired(true)
    ),

  async execute(interaction) {
    const messageId = interaction.options.getString('message', true);
    const emoji = interaction.options.getString('emoji', true);
    const role = interaction.options.getRole('role', true);

    const channel = interaction.channel;

    if (!channel || channel.type !== ChannelType.GuildText) {
      await interaction.reply({ content: 'This command can only be used in text-based channels.', ephemeral: true });
      return;
    }

    if (!interaction.guild.members.me.permissions.has([
      PermissionsBitField.Flags.ManageRoles,
      PermissionsBitField.Flags.ManageMessages,
      PermissionsBitField.Flags.AddReactions
    ])) {
      await interaction.reply({ content: 'I do not have the required permissions to manage roles, messages, or add reactions in this server.', ephemeral: true });
      return;
    }

    try {
      const message = await channel.messages.fetch(messageId);
      await message.react(emoji);

      const config = {
        emojiRoleMap: {
          [emoji]: [role.id]
        },
        policy: 'unique',
        removeReaction: true
      };

      const filter = (reaction, user) => reaction.emoji.name === emoji && !user.bot;
      const collector = message.createReactionCollector({ filter });

      collector.on('collect', async (reaction, user) => {
        const manager = new ReactionRoleManager(reaction, user, config);
        await manager.setRoles();
      });

      collector.on('remove', async (reaction, user) => {
        const manager = new ReactionRoleManager(reaction, user, config);
        await manager.setRoles();
      });

      const embed = new EmbedBuilder()
        .setColor(0x00FF00) 
        .setTitle('Reaction Role Setup')
        .setDescription(`React with ${emoji} to get the ${role.name} role.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error(`Failed to set up reaction role: ${error}`);
      await interaction.reply({ content: 'Failed to set up reaction role. Please check the message ID and try again.', ephemeral: true });
    }
  },
};
