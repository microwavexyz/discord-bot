import { Client, Events, Message, PermissionsBitField, TextChannel, EmbedBuilder, Colors, DiscordAPIError } from 'discord.js';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

// Configuration for the anti-spam system
const spamConfig = {
  maxMessages: 5,
  interval: 5000, // 5 seconds
  muteDuration: 60000, // 1 minute
  warningCount: 3, // Number of warnings before muting
  warningMessage: "Please stop spamming or you will be muted.",
  muteMessage: "You have been muted for spamming.",
  logChannelId: '1245468533467648121', // Replace with your logging channel ID
  warningMessageDuration: 5000, // 5 seconds
};

// File to persist user warnings
const warningsFile = path.join(__dirname, '../data/warnings.json');

// Function to read warnings from file
function readWarnings(): Record<string, number> {
  try {
    return JSON.parse(readFileSync(warningsFile, 'utf-8'));
  } catch (error) {
    return {};
  }
}

// Function to write warnings to file
function writeWarnings(warnings: Record<string, number>) {
  writeFileSync(warningsFile, JSON.stringify(warnings, null, 2), 'utf-8');
}

const warnings = readWarnings();

// Map to store user message timestamps and messages
interface UserData {
  timestamps: number[];
  messages: Message[];
  isMuted: boolean;
}
const userMessages: Map<string, UserData> = new Map();

export function registerSpamDetection(client: Client) {
  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot) return; // Ignore bot messages

    const { author, guild, channel } = message;
    if (!guild) return; // Ignore DMs

    const userId = author.id;
    const now = Date.now();

    if (!userMessages.has(userId)) {
      userMessages.set(userId, { timestamps: [], messages: [], isMuted: false });
    }

    const userData = userMessages.get(userId)!;
    userData.timestamps.push(now);
    userData.messages.push(message);

    // Filter out timestamps older than the interval
    userData.timestamps = userData.timestamps.filter(timestamp => now - timestamp < spamConfig.interval);

    if (userData.timestamps.length > spamConfig.maxMessages) {
      // Handle spam behavior
      if (!warnings[userId]) {
        warnings[userId] = 0;
      }

      warnings[userId] += 1;

      if (warnings[userId] >= spamConfig.warningCount && !userData.isMuted) {
        const member = guild.members.cache.get(userId);
        if (member) {
          // Check for necessary permissions
          if (!guild.members.me?.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            console.error('Missing MODERATE_MEMBERS permission.');
            return;
          }

          // Check if bot's role is higher than the member's role
          if (guild.members.me.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
            console.error('Bot role is not high enough to mute this member.');
            return;
          }

          try {
            await member.timeout(spamConfig.muteDuration);

            // Send mute message in an embed
            const muteEmbed = new EmbedBuilder()
              .setColor(Colors.Red)
              .setTitle('User Muted')
              .setDescription(`${member} ${spamConfig.muteMessage}`)
              .setTimestamp();

            await channel.send({ embeds: [muteEmbed] });

            // Log the action
            const logChannel = guild.channels.cache.get(spamConfig.logChannelId) as TextChannel;
            if (logChannel) {
              const logEmbed = new EmbedBuilder()
                .setColor(Colors.Red)
                .setTitle('User Muted for Spamming')
                .setDescription(`Muted ${member} for spamming.`)
                .setTimestamp();

              await logChannel.send({ embeds: [logEmbed] });
            }

            // Delete user's spam messages
            for (const msg of userData.messages) {
              try {
                await msg.delete();
              } catch (error) {
                if (error instanceof DiscordAPIError && error.code === 10008) {
                  console.warn('Message already deleted:', msg.id);
                } else {
                  console.error('Failed to delete user message:', error);
                }
              }
            }

            // Mark the user as muted
            userData.isMuted = true;

            // Clear user data
            userMessages.delete(userId);
            warnings[userId] = 0; // Reset warnings
          } catch (error) {
            console.error('Failed to mute member:', error);
          }
        }
      } else if (warnings[userId] < spamConfig.warningCount) {
        try {
          // Send warning message in an embed
          const warningEmbed = new EmbedBuilder()
            .setColor(Colors.Yellow)
            .setTitle('Warning')
            .setDescription(`${author} ${spamConfig.warningMessage}`)
            .setTimestamp();

          const warningMessage = await channel.send({ embeds: [warningEmbed] });

          // Delete warning message after a delay
          setTimeout(async () => {
            try {
              await warningMessage.delete();
            } catch (error) {
              if (error instanceof DiscordAPIError && error.code === 10008) {
                console.warn('Warning message already deleted:', warningMessage.id);
              } else {
                console.error('Failed to delete warning message:', error);
              }
            }
          }, spamConfig.warningMessageDuration); // Delete after specified duration
        } catch (error) {
          console.error('Failed to send warning message:', error);
        }
      }

      writeWarnings(warnings); // Persist warnings to file
    }
  });
}
