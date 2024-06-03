import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ComponentType,
    MessageComponentInteraction,
    PermissionsBitField,
  } from 'discord.js';
  import { Command } from '../types/command';
  
  const moderators = [
    // Example data; replace with your actual data source
    { id: 'mod1', name: 'Mod1', actions: 120, lastActive: '2023-05-20' },
    { id: 'mod2', name: 'Mod2', actions: 150, lastActive: '2023-05-18' },
    // Add more moderators here
  ];
  
  const commandsPerPage = 5; // Number of moderators to show per page
  
  const generateEmbed = (page: number): EmbedBuilder => {
    const start = (page - 1) * commandsPerPage;
    const end = start + commandsPerPage;
    const modsToShow = moderators.slice(start, end);
  
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('Moderators Stats')
      .setDescription('Use the buttons to navigate through the moderators list.')
      .addFields(
        modsToShow.map((mod) => ({
          name: mod.name,
          value: `Actions: ${mod.actions}\nLast Active: ${mod.lastActive}`,
        }))
      )
      .setFooter({ text: `Page ${page} of ${Math.ceil(moderators.length / commandsPerPage)}` });
  
    return embed;
  };
  
  export const command: Command = {
    data: new SlashCommandBuilder()
      .setName('modview')
      .setDescription('View stats of moderators'),
    async execute(interaction: ChatInputCommandInteraction) {
      // Ensure only admins can use this command
      if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
        await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        return;
      }
  
      let currentPage = 1;
      const totalPages = Math.ceil(moderators.length / commandsPerPage);
  
      const embed = generateEmbed(currentPage);
  
      const prevButton = new ButtonBuilder()
        .setCustomId('prev_page')
        .setLabel('◀')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === 1);
  
      const nextButton = new ButtonBuilder()
        .setCustomId('next_page')
        .setLabel('▶')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === totalPages);
  
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(prevButton, nextButton);
  
      const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
  
      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000, // Collector will stop after 60 seconds
      });
  
      collector.on('collect', async (buttonInteraction: MessageComponentInteraction) => {
        if (buttonInteraction.user.id !== interaction.user.id) {
          await buttonInteraction.reply({ content: 'You cannot interact with this button.', ephemeral: true });
          return;
        }
  
        if (buttonInteraction.customId === 'prev_page' && currentPage > 1) {
          currentPage--;
        } else if (buttonInteraction.customId === 'next_page' && currentPage < totalPages) {
          currentPage++;
        }
  
        const newEmbed = generateEmbed(currentPage);
        const newPrevButton = new ButtonBuilder()
          .setCustomId('prev_page')
          .setLabel('◀')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === 1);
  
        const newNextButton = new ButtonBuilder()
          .setCustomId('next_page')
          .setLabel('▶')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === totalPages);
  
        const newRow = new ActionRowBuilder<ButtonBuilder>().addComponents(newPrevButton, newNextButton);
  
        await buttonInteraction.update({ embeds: [newEmbed], components: [newRow] });
      });
  
      collector.on('end', () => {
        if (message.editable) {
          const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            prevButton.setDisabled(true),
            nextButton.setDisabled(true)
          );
          message.edit({ components: [disabledRow] }).catch(console.error);
        }
      });
    },
  };
  