import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    PermissionsBitField,
  } from 'discord.js';
  import { Command } from '../types/command';
  import { NodeVM } from 'vm2';
  
  export const command: Command = {
    data: new SlashCommandBuilder()
      .setName('eval')
      .setDescription('Evaluates JavaScript code in a sandboxed environment.')
      .addStringOption(option =>
        option.setName('code')
          .setDescription('The JavaScript code to evaluate')
          .setRequired(true)
      ),
  
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
      const ownerId = '1020809619343409182';
  
      if (interaction.user.id !== ownerId) {
        await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        return;
      }
  
      const code = interaction.options.getString('code');
      if (!code) {
        await interaction.reply({ content: 'Please provide the code to evaluate.', ephemeral: true });
        return;
      }
  
      try {
        const vm = new NodeVM({
          console: 'inherit',
          sandbox: {},
          timeout: 1000,
          allowAsync: false,
          require: {
            external: false,
          }
        });
  
        const result = vm.run(code);
        const output = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
  
        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('Eval Result')
          .setDescription(`\`\`\`js\n${output}\n\`\`\``)
          .setTimestamp();
  
        await interaction.reply({ embeds: [embed] });
  
      } catch (error) {
        let errorMessage = 'An unknown error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
  
        const errorEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('Error')
          .setDescription(`\`\`\`js\n${errorMessage}\n\`\`\``)
          .setTimestamp();
  
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
  
      // Log the evaluation attempt for monitoring
      console.log(`User ${interaction.user.tag} attempted to evaluate code.`);
    },
  };
  