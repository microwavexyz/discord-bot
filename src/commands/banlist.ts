import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, CacheType, InteractionResponse, PermissionFlagsBits } from 'discord.js';
import { Command } from '../types/command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('banlist')
    .setDescription('Displays a list of banned members')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers)) {
      await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      return;
    }

    const bans = await interaction.guild?.bans.fetch();
    if (!bans) {
      await interaction.reply({ content: 'Unable to fetch ban list.', ephemeral: true });
      return;
    }

    const bannedUsers = bans.map(ban => ({
      tag: `${ban.user.tag} (${ban.user.id})`,
      reason: ban.reason || 'No reason provided'
    }));

    if (bannedUsers.length === 0) {
      await interaction.reply({ content: 'No banned users found.', ephemeral: true });
      return;
    }

    const itemsPerPage = 5;
    const totalPages = Math.ceil(bannedUsers.length / itemsPerPage);
    let currentPage = 0;

    const generateEmbed = (page: number) => {
      const start = page * itemsPerPage;
      const end = start + itemsPerPage;
      const currentItems = bannedUsers.slice(start, end);

      const embed = new EmbedBuilder()
        .setTitle('Banned Members')
        .setColor(0xFF0000)
        .setFooter({ text: `Page ${page + 1} of ${totalPages}` })
        .setTimestamp();

      currentItems.forEach(item => {
        embed.addFields({ name: item.tag, value: item.reason });
      });

      return embed;
    };

    const components = (page: number) => [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('Previous')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Next')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === totalPages - 1)
      )
    ];

    await interaction.reply({ embeds: [generateEmbed(currentPage)], components: components(currentPage) });

    const filter = (i: any) => i.customId === 'prev' || i.customId === 'next';
    const collector = interaction.channel?.createMessageComponentCollector({ filter, time: 60000 });

    collector?.on('collect', async i => {
      if (i.customId === 'prev') {
        currentPage--;
      } else if (i.customId === 'next') {
        currentPage++;
      }
      await i.update({ embeds: [generateEmbed(currentPage)], components: components(currentPage) });
    });

    collector?.on('end', async () => {
      await interaction.editReply({ components: [] });
    });
  },
};
