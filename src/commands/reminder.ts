import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types/command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('reminder')
    .setDescription('Set a reminder')
    .addStringOption(option =>
      option.setName('time')
        .setDescription('Time to wait before sending the reminder (e.g., 10s, 5m, 1h)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The reminder message')
        .setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    const time = interaction.options.getString('time', true);
    const message = interaction.options.getString('message', true);

    const timeRegex = /^(\d+)(s|m|h|d)$/;
    const matches = time.match(timeRegex);

    if (!matches) {
      await interaction.reply({ content: 'Invalid time format. Use "s" for seconds, "m" for minutes, "h" for hours, and "d" for days.', ephemeral: true });
      return;
    }

    const value = parseInt(matches[1]);
    const unit = matches[2];

    const ms = convertToMilliseconds(value, unit);
    if (ms === 0) {
      await interaction.reply({ content: 'Invalid time unit. Use "s" for seconds, "m" for minutes, "h" for hours, and "d" for days.', ephemeral: true });
      return;
    }

    const embed = createReminderEmbed(0x00ff00, `I will remind you in ${time} with the following message:\n"${message}"`);
    await interaction.reply({ embeds: [embed], ephemeral: true });

    setTimeout(async () => {
      await sendReminder(interaction, message);
    }, ms);
  },
};

/**
 * Converts time to milliseconds based on the unit provided.
 * @param value The time value.
 * @param unit The unit of time ('s', 'm', 'h', 'd').
 * @returns The equivalent time in milliseconds.
 */
function convertToMilliseconds(value: number, unit: string): number {
  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
}

/**
 * Creates an embed for the reminder.
 * @param color The color of the embed.
 * @param description The description of the embed.
 * @returns The created EmbedBuilder.
 */
function createReminderEmbed(color: number, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(color)
    .setDescription(description);
}

/**
 * Sends a reminder to the user.
 * @param interaction The interaction object.
 * @param message The reminder message.
 */
async function sendReminder(interaction: ChatInputCommandInteraction, message: string) {
  const reminderEmbed = createReminderEmbed(0xff0000, `Reminder: ${message}`);

  try {
    await interaction.user.send({ embeds: [reminderEmbed] });
  } catch (dmError) {
    console.error('Failed to send DM reminder:', dmError);
    await interaction.followUp({ content: 'I could not send you a DM. Here is your reminder:', embeds: [reminderEmbed], ephemeral: true });
  }
}
