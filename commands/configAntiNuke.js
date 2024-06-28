const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ServerSettings = require('../models/ServerSettings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configantinuke')
    .setDescription('Configure the anti-nuke settings')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(option =>
      option.setName('adminrole')
        .setDescription('Set the admin role')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option.setName('enabled')
        .setDescription('Enable or disable the anti-nuke module')
    )
    .addIntegerOption(option =>
      option.setName('timeframe')
        .setDescription('Time frame for tracking actions in seconds')
        .setMinValue(10)
        .setMaxValue(300)
    )
    .addIntegerOption(option =>
      option.setName('maxchannelsdeleted')
        .setDescription('Max channels that can be deleted')
        .setMinValue(1)
        .setMaxValue(10)
    )
    .addIntegerOption(option =>
      option.setName('maxrolesdeleted')
        .setDescription('Max roles that can be deleted')
        .setMinValue(1)
        .setMaxValue(10)
    )
    .addIntegerOption(option =>
      option.setName('maxrolechanges')
        .setDescription('Max role changes that can be made')
        .setMinValue(1)
        .setMaxValue(20)
    )
    .addIntegerOption(option =>
      option.setName('maxchannelscreated')
        .setDescription('Max channels that can be created')
        .setMinValue(1)
        .setMaxValue(10)
    )
    .addIntegerOption(option =>
      option.setName('maxrolescreated')
        .setDescription('Max roles that can be created')
        .setMinValue(1)
        .setMaxValue(10)
    )
    .addIntegerOption(option =>
      option.setName('maxmentions')
        .setDescription('Max mentions in a message')
        .setMinValue(1)
        .setMaxValue(50)
    )
    .addIntegerOption(option =>
      option.setName('maxnicknameschanged')
        .setDescription('Max nickname changes that can be made')
        .setMinValue(1)
        .setMaxValue(20)
    )
    .addIntegerOption(option =>
      option.setName('maxbotsadded')
        .setDescription('Max bots that can be added')
        .setMinValue(1)
        .setMaxValue(10)
    )
    .addIntegerOption(option =>
      option.setName('maxusersadded')
        .setDescription('Max users that can be added')
        .setMinValue(1)
        .setMaxValue(50)
    )
    .addIntegerOption(option =>
      option.setName('maxchannelrenames')
        .setDescription('Max channel renames that can be made')
        .setMinValue(1)
        .setMaxValue(20)
    )
    .addIntegerOption(option =>
      option.setName('maxcategoriescreated')
        .setDescription('Max categories that can be created')
        .setMinValue(1)
        .setMaxValue(10)
    )
    .addIntegerOption(option =>
      option.setName('maxcategoryrenames')
        .setDescription('Max category renames that can be made')
        .setMinValue(1)
        .setMaxValue(20)
    )
    .addIntegerOption(option =>
      option.setName('maxwebhookmessages')
        .setDescription('Max webhook messages in a timeframe')
        .setMinValue(1)
        .setMaxValue(50)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const adminRole = interaction.options.getRole('adminrole');

    if (!adminRole) {
      return interaction.reply({ embeds: [createErrorEmbed('Admin role is required to configure anti-nuke settings.')], ephemeral: true });
    }

    await interaction.deferReply();

    try {
      let settings = await ServerSettings.findOne({ guildId }) || new ServerSettings({ guildId });

      const options = [
        'enabled', 'maxchannelsdeleted', 'maxrolesdeleted', 'maxrolechanges',
        'maxchannelscreated', 'maxrolescreated', 'maxmentions', 'maxnicknameschanged',
        'maxbotsadded', 'maxusersadded', 'maxchannelrenames', 'maxcategoriescreated',
        'maxcategoryrenames', 'maxwebhookmessages', 'timeframe'
      ];

      options.forEach(option => {
        const value = interaction.options.get(option)?.value;
        if (value !== undefined) {
          settings[option] = option === 'timeframe' ? value * 1000 : value; // Convert timeframe to milliseconds
        }
      });

      settings.adminRole = adminRole.id;
      await settings.save();

      const embed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setTitle('🛡️ Anti-Nuke Configuration Updated')
        .setDescription('The anti-nuke settings have been updated successfully!')
        .addFields(
          { name: 'Admin Role', value: `<@&${settings.adminRole}>`, inline: true },
          { name: 'Enabled', value: settings.enabled ? 'Yes' : 'No', inline: true },
          { name: 'Time Frame', value: `${settings.timeFrame / 1000} seconds`, inline: true },
          { name: 'Max Channels Deleted', value: `${settings.maxChannelsDeleted}`, inline: true },
          { name: 'Max Roles Deleted', value: `${settings.maxRolesDeleted}`, inline: true },
          { name: 'Max Role Changes', value: `${settings.maxRoleChanges}`, inline: true },
          { name: 'Max Channels Created', value: `${settings.maxChannelsCreated}`, inline: true },
          { name: 'Max Roles Created', value: `${settings.maxRolesCreated}`, inline: true },
          { name: 'Max Mentions', value: `${settings.maxMentions}`, inline: true },
          { name: 'Max Nicknames Changed', value: `${settings.maxNicknamesChanged}`, inline: true },
          { name: 'Max Bots Added', value: `${settings.maxBotsAdded}`, inline: true },
          { name: 'Max Users Added', value: `${settings.maxUsersAdded}`, inline: true },
          { name: 'Max Channel Renames', value: `${settings.maxChannelRenames}`, inline: true },
          { name: 'Max Categories Created', value: `${settings.maxCategoriesCreated}`, inline: true },
          { name: 'Max Category Renames', value: `${settings.maxCategoryRenames}`, inline: true },
          { name: 'Max Webhook Messages', value: `${settings.maxWebhookMessages}`, inline: true }
        )
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error updating anti-nuke settings:', error);
      await interaction.editReply({ embeds: [createErrorEmbed('There was an error updating the anti-nuke settings. Please try again later.')] });
    }
  },
};

function createErrorEmbed(description) {
  return new EmbedBuilder()
    .setColor(0xE74C3C)
    .setTitle('❌ Error')
    .setDescription(description)
    .setTimestamp();
}