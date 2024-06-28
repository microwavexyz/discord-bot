const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays a list of available commands'),
  async execute(interaction) {
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({ content: 'I need permission to send messages in this channel.', ephemeral: true });
    }

    const client = interaction.client;
    const commands = client.commands.map(command => `\`/${command.data.name}\` - ${command.data.description}`);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(commands.length / itemsPerPage);

    let currentPage = 0;

    const generateEmbed = (page) => {
      const start = page * itemsPerPage;
      const end = start + itemsPerPage;
      const commandList = commands.slice(start, end).join('\n');

      return new EmbedBuilder()
        .setTitle('Help')
        .setDescription(`Here are the available commands:\n\n${commandList}`)
        .setColor(0x00FF00)
        .setFooter({ text: `Page ${page + 1} of ${totalPages}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
    };

    const generateButtons = (page) => {
      return new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('previous')
            .setLabel('⬅️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId('next')
            .setLabel('➡️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === totalPages - 1),
        );
    };

    const embed = generateEmbed(currentPage);
    const buttons = generateButtons(currentPage);

    try {
      const message = await interaction.reply({ embeds: [embed], components: [buttons], fetchReply: true });

      const collector = message.createMessageComponentCollector({ time: 60000 });

      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: 'You cannot use these buttons.', ephemeral: true });
        }

        // Defer the update immediately
        await i.deferUpdate();

        if (i.customId === 'previous') {
          currentPage = Math.max(0, currentPage - 1);
        } else if (i.customId === 'next') {
          currentPage = Math.min(totalPages - 1, currentPage + 1);
        }

        const newEmbed = generateEmbed(currentPage);
        const newButtons = generateButtons(currentPage);

        // Edit the message with new content
        await i.editReply({ embeds: [newEmbed], components: [newButtons] });
      });

      collector.on('end', async () => {
        const finalButtons = generateButtons(currentPage);
        finalButtons.components.forEach(button => button.setDisabled(true));
        
        try {
          await interaction.editReply({ components: [finalButtons] });
        } catch (error) {
          console.error('Failed to edit reply after collector end:', error);
        }
      });
    } catch (error) {
      console.error('Failed to send initial help message:', error);
      await interaction.reply({ content: 'There was an error displaying the help message. Please try again later.', ephemeral: true });
    }
  },
};