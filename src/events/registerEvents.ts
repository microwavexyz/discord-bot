import {
  Client,
  Interaction,
  TextChannel,
  EmbedBuilder,
  PermissionsBitField,
  ChannelType,
  GuildMember,
  CategoryChannel,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  Message,
  CommandInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
} from 'discord.js';

const SUPPORT_ROLE_NAME = 'Support'; // Replace with your desired support role name
const openTickets = new Map<string, string>(); // Track open tickets by user ID
let lowPriorityCategoryId = '1245464305286119565'; // Replace with your low priority category ID
const verificationChannelId = 'nil'; // Replace with your verification channel ID

function truncateString(str: string, maxLength: number): string {
  return str.length <= maxLength ? str : str.substring(0, maxLength - 3) + '...';
}

export const registerEvents = (client: Client) => {
  client.on('interactionCreate', async (interaction: Interaction) => {
    try {
      if (interaction.isButton()) {
        await handleButtonInteraction(interaction as ButtonInteraction);
      } else if (interaction.isModalSubmit()) {
        await handleModalSubmit(interaction as ModalSubmitInteraction);
      }
    } catch (error) {
      console.error('Error handling interaction:', error);
      if ('reply' in interaction && typeof interaction.reply === 'function') {
        await interaction.reply({ content: 'An unexpected error occurred. Please try again later.', ephemeral: true });
      }
    }
  });

  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.channel.id === verificationChannelId && !message.author.bot && !message.content.startsWith('/verify')) {
      try {
        await message.delete();
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    }
  });
};

async function handleButtonInteraction(interaction: ButtonInteraction) {
  const userId = interaction.user.id;

  if (interaction.customId === 'create_ticket') {
    if (openTickets.has(userId)) {
      await interaction.reply({
        content: 'You already have an open ticket. Please close it before creating a new one.',
        ephemeral: true,
      });
      return;
    }

    const modal = new ModalBuilder().setCustomId('ticket_creation_modal').setTitle('Ticket Creation');

    const ticketReasonInput = new TextInputBuilder()
      .setCustomId('ticket_reason')
      .setLabel('Ticket Reason')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Write your reason for creating a ticket here.')
      .setRequired(true);

    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(ticketReasonInput);
    modal.addComponents(actionRow);

    await interaction.showModal(modal);

  } else if (interaction.customId === 'close_ticket') {
    await handleTicketClosure(interaction);

  } else if (interaction.customId === 'reopen_ticket') {
    await handleTicketReopening(interaction);

  } else if (interaction.customId === 'delete_ticket') {
    await handleTicketDeletion(interaction);
  }
}

async function handleModalSubmit(interaction: ModalSubmitInteraction) {
  const reason = interaction.fields.getTextInputValue('ticket_reason').substring(0, 2000); // Truncate to 2000 characters

  if (!interaction.guild) {
    await interaction.reply({ content: 'This command can only be used in a guild.', ephemeral: true });
    return;
  }

  const member = interaction.member as GuildMember | null;
  if (!member) {
    await interaction.reply({ content: 'Could not retrieve member information.', ephemeral: true });
    return;
  }

  const userId = interaction.user.id;
  const channelName = `ticket-${interaction.user.username}`;

  let categoryChannel = interaction.guild.channels.cache.get(lowPriorityCategoryId) as CategoryChannel | undefined;
  if (!categoryChannel) {
    categoryChannel = interaction.guild.channels.cache.find(
      channel => channel.name === 'Low Priority Tickets' && channel.type === ChannelType.GuildCategory
    ) as CategoryChannel;

    if (!categoryChannel) {
      categoryChannel = await interaction.guild.channels.create({
        name: 'Low Priority Tickets',
        type: ChannelType.GuildCategory,
      });

      lowPriorityCategoryId = categoryChannel.id; // Update the category ID
    }
  }

  let supportRole = interaction.guild.roles.cache.find(role => role.name === SUPPORT_ROLE_NAME);
  if (!supportRole) {
    // Create the support role if it doesn't exist
    supportRole = await interaction.guild.roles.create({
      name: SUPPORT_ROLE_NAME,
      permissions: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
    });
  }

  const channel = await interaction.guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    topic: `Ticket created by ${interaction.user.tag} for reason: ${reason}`,
    parent: categoryChannel.id,
    permissionOverwrites: [
      {
        id: interaction.guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: interaction.user.id,
        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
      },
      {
        id: supportRole.id,
        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
      },
    ],
  });

  openTickets.set(userId, channel.id);

  const description = `Welcome <@${interaction.user.id}>! A member of staff will assist you shortly. In the meantime, please describe your issue.\n\n**Reason:** ${reason}`;
  const truncatedDescription = truncateString(description, 4096);

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle('Welcome!')
    .setDescription(truncatedDescription)
    .setThumbnail(interaction.user.displayAvatarURL());

  const closeButton = new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒');

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(closeButton);

  await (channel as TextChannel).send({ content: `<@&${supportRole.id}>`, embeds: [embed], components: [row] });
  await interaction.reply({ content: `Ticket created: ${channel}`, ephemeral: true });
}

async function handleTicketClosure(interaction: ButtonInteraction) {
  if (!interaction.channel || !(interaction.channel instanceof TextChannel)) {
    await interaction.reply({ content: 'This command can only be used in a text channel.', ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xffa500)
    .setTitle('Ticket Closure')
    .setDescription('Are you sure you want to close this ticket?')
    .setTimestamp();

  const reopenButton = new ButtonBuilder().setCustomId('reopen_ticket').setLabel('Reopen Ticket').setStyle(ButtonStyle.Secondary).setEmoji('🔓');

  const deleteButton = new ButtonBuilder().setCustomId('delete_ticket').setLabel('Delete Ticket').setStyle(ButtonStyle.Danger).setEmoji('🗑️');

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(reopenButton, deleteButton);

  await interaction.reply({ embeds: [embed], components: [row] });
}

async function handleTicketReopening(interaction: ButtonInteraction) {
  if (!interaction.guild) {
    await interaction.reply({ content: 'This command can only be used in a guild.', ephemeral: true });
    return;
  }

  if (!interaction.channel || !(interaction.channel instanceof TextChannel)) {
    await interaction.reply({ content: 'This command can only be used in a text channel.', ephemeral: true });
    return;
  }

  const userId = interaction.user.id;

  await interaction.channel.permissionOverwrites.edit(interaction.guild.id, {
    ViewChannel: false,
  });

  await interaction.channel.permissionOverwrites.edit(interaction.user.id, {
    ViewChannel: true,
    SendMessages: true,
  });

  let supportRole = interaction.guild.roles.cache.find(role => role.name === SUPPORT_ROLE_NAME);
  if (!supportRole) {
    // Create the support role if it doesn't exist
    supportRole = await interaction.guild.roles.create({
      name: SUPPORT_ROLE_NAME,
      permissions: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
    });
  }

  await interaction.channel.permissionOverwrites.edit(supportRole.id, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
  });

  await interaction.reply({ content: 'The ticket has been reopened.', ephemeral: true });

  const panelMessage = interaction.message;
  if (panelMessage && panelMessage.deletable) {
    await panelMessage.delete();
  }
}

async function handleTicketDeletion(interaction: ButtonInteraction) {
  if (!interaction.channel || !(interaction.channel instanceof TextChannel)) {
    await interaction.reply({ content: 'This command can only be used in a text channel.', ephemeral: true });
    return;
  }

  await interaction.channel.delete();
  const userId = interaction.user.id;
  openTickets.delete(userId);
}
