import { MessageReaction, User, PartialUser } from 'discord.js';
import { giveaways } from '../commands/startGiveaway';

export const messageReactionAdd = async (reaction: MessageReaction, user: User | PartialUser) => {
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Error fetching reaction:', error);
      return;
    }
  }

  if (user.partial) {
    try {
      await user.fetch();
    } catch (error) {
      console.error('Error fetching user:', error);
      return;
    }
  }

  if (reaction.emoji.name === '🎉') {
    const entries = giveaways.get(reaction.message.id);
    if (entries) {
      entries.add(user.id);
    }
  }
};
