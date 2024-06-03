import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { Command } from '../types/command';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnection } from '@discordjs/voice';
import ytdl from 'ytdl-core';

type Queue = Map<string, {
  voiceChannel: any;
  connection: VoiceConnection | null;
  player: any;
  songs: string[];
}>;

const queue: Queue = new Map();

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song')
    .addStringOption(option => option.setName('url').setDescription('YouTube URL').setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    const url = interaction.options.getString('url', true);
    const guildMember = interaction.member as GuildMember;
    const voiceChannel = guildMember.voice.channel;

    if (!voiceChannel) {
      await interaction.reply('You need to be in a voice channel to play music!');
      return;
    }

    const serverQueue = queue.get(interaction.guildId!);

    if (serverQueue) {
      serverQueue.songs.push(url);
      await interaction.reply(`Added to queue: ${url}`);
    } else {
      const queueContruct = {
        voiceChannel: voiceChannel,
        connection: null as VoiceConnection | null,
        player: createAudioPlayer(),
        songs: [url],
      };

      queue.set(interaction.guildId!, queueContruct);

      try {
        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guildId!,
          adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        queueContruct.connection = connection;
        connection.subscribe(queueContruct.player);

        await interaction.reply(`Started playing: ${url}`);
        playSong(interaction.guildId!, queueContruct.songs[0]);
      } catch (err) {
        console.log(err);
        queue.delete(interaction.guildId!);
        await interaction.reply('Error connecting to the voice channel.');
      }
    }
  },
};

async function playSong(guildId: string, song: string) {
  const serverQueue = queue.get(guildId);
  if (!song) {
    serverQueue?.connection?.destroy();
    queue.delete(guildId);
    return;
  }

  const stream = ytdl(song, { filter: 'audioonly' });
  const resource = createAudioResource(stream);
  serverQueue!.player.play(resource);

  serverQueue!.player.on(AudioPlayerStatus.Idle, () => {
    serverQueue!.songs.shift();
    playSong(guildId, serverQueue!.songs[0]);
  });

  serverQueue!.player.on('error', (error: any) => {
    console.error(error);
    serverQueue!.songs.shift();
    playSong(guildId, serverQueue!.songs[0]);
  });
}
