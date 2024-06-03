// src/tests/loadCommands.test.ts
import fs from 'fs';
import path from 'path';
import { loadCommands } from '../loadCommands';

jest.mock('fs');

describe('Command Loader', () => {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const validCommand = { command: { data: { toJSON: () => ({ name: 'validCommand' }) } } };
  const invalidCommand = { command: null };

  beforeEach(() => {
    jest.resetModules();
  });

  it('should load valid commands', () => {
    (fs.readdirSync as jest.Mock).mockReturnValue(['validCommand.js']);
    jest.mock('../commands/validCommand', () => validCommand, { virtual: true });

    const commands = loadCommands(commandsPath);
    expect(commands).toEqual([{ name: 'validCommand' }]);
  });

  it('should log a warning for invalid commands', () => {
    console.warn = jest.fn();
    (fs.readdirSync as jest.Mock).mockReturnValue(['invalidCommand.js']);
    jest.mock('../commands/invalidCommand', () => invalidCommand, { virtual: true });

    loadCommands(commandsPath);
    expect(console.warn).toHaveBeenCalledWith('Command in invalidCommand.js is not structured correctly.');
  });

  it('should handle empty command directory', () => {
    (fs.readdirSync as jest.Mock).mockReturnValue([]);

    const commands = loadCommands(commandsPath);
    expect(commands).toEqual([]);
  });

  it('should handle commands that throw errors during loading', () => {
    console.error = jest.fn();
    (fs.readdirSync as jest.Mock).mockReturnValue(['errorCommand.js']);
    jest.mock('../commands/errorCommand', () => { throw new Error('Test Error'); }, { virtual: true });

    loadCommands(commandsPath);
    expect(console.error).toHaveBeenCalledWith('Error loading command errorCommand.js:', expect.any(Error));
  });
});
