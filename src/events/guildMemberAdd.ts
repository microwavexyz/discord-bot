import { GuildMember, TextChannel, EmbedBuilder, ChannelType, PermissionsBitField } from 'discord.js';
import fs from 'fs';
import path from 'path';

const configPath = path.join(__dirname, '../data/welcomeConfig.json');

// Load the configuration with error handling
let welcomeConfig;
try {
  welcomeConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error('Error reading welcomeConfig file:', error);
  welcomeConfig = { enabled: false, welcomeChannelId: null, specificChannelId: null };
}

const saveConfig = () => {
  try {
    fs.writeFileSync(configPath, JSON.stringify(welcomeConfig, null, 2));
  } catch (error) {
    console.error('Error saving welcomeConfig file:', error);
  }
};

export const guildMemberAdd = async (member: GuildMember) => {
  if (!welcomeConfig.enabled) return;

  let welcomeChannel: TextChannel | null = null;

  if (welcomeConfig.specificChannelId) {
    const channel = member.guild.channels.cache.get(welcomeConfig.specificChannelId);
    if (channel && channel.isTextBased()) {
      welcomeChannel = channel as TextChannel;
    }
  }

  if (!welcomeChannel && welcomeConfig.welcomeChannelId) {
    const channel = member.guild.channels.cache.get(welcomeConfig.welcomeChannelId);
    if (channel && channel.isTextBased()) {
      welcomeChannel = channel as TextChannel;
    }
  }

  if (!welcomeChannel) {
    if (!member.guild.members.me?.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      console.error('Bot lacks permission to create channels.');
      return;
    }

    try {
      welcomeChannel = await member.guild.channels.create({
        name: 'welcome',
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: member.guild.id,
            allow: [PermissionsBitField.Flags.ViewChannel],
          },
        ],
      });

      welcomeConfig.welcomeChannelId = welcomeChannel.id;
      saveConfig();
    } catch (error) {
      console.error('Error creating welcome channel:', error);
      return;
    }
  }

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle('Welcome!')
    .setDescription(`Welcome <@${member.id}> to the server!`)
    .setThumbnail(member.user.displayAvatarURL())
    .setTimestamp();

  try {
    await welcomeChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Error sending welcome message:', error);
  }
};
