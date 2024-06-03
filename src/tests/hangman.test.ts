import { ChatInputCommandInteraction, Message, TextChannel, CommandInteractionOptionResolver, EmbedBuilder, Colors } from 'discord.js';
import { command } from '../commands/hangman';
import { mock, instance, when, verify, anyString, deepEqual } from 'ts-mockito';

describe('Hangman Command', () => {
    let interaction: ChatInputCommandInteraction;
    let message: Message;
    let textChannel: TextChannel;
    let options: CommandInteractionOptionResolver;

    beforeEach(() => {
        interaction = mock<ChatInputCommandInteraction>();
        message = mock<Message>();
        textChannel = mock<TextChannel>();
        options = mock<CommandInteractionOptionResolver>();

        when(interaction.options).thenReturn(instance(options));
        when(options.getString('guess')).thenReturn(null);
        when(interaction.reply(anyString())).thenResolve();
        when(interaction.reply(deepEqual({
            embeds: [deepEqual({
                title: 'Hangman Game Started!',
                description: expect.stringContaining('Word:'),
                color: Colors.Blue
            })]
        }))).thenResolve();
        when(interaction.fetchReply()).thenResolve(instance(message));
        when(message.channel).thenReturn(instance(textChannel));
        when(textChannel.createMessageCollector).thenReturn(() => ({
            on: jest.fn(),
            stop: jest.fn()
        } as any));
    });

    test('should start a new game', async () => {
        await command.execute(instance(interaction));

        verify(interaction.reply(deepEqual({
            embeds: [deepEqual({
                title: 'Hangman Game Started!',
                description: expect.stringContaining('Word:'),
                color: Colors.Blue
            })]
        }))).called();
    });

    test('should reject invalid guess', async () => {
        when(options.getString('guess')).thenReturn('invalid');
        await command.execute(instance(interaction));

        verify(interaction.reply('Please start the game first by using `/hangman` without any guesses.')).called();
    });

    // Additional tests for game logic, correct/incorrect guesses, win/loss conditions, etc.
});
