import { Client, Collection } from 'discord.js';
import { Command } from './command';

export interface CustomClient extends Client {
  commands: Collection<string, Command>;
}
