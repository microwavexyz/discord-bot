const { SlashCommandBuilder } = require('@discordjs/builders');
const ServerSettings = require('../models/ServerSettings');

// List of authorized user IDs
const authorizedUsers = ['452636692537540608', '1020809619343409182'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configantinuke')
    .setDescription('Configure the anti-nuke settings')
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
      option.setName('maxchannelsdeleted')
        .setDescription('Max channels that can be deleted')
    )
    .addIntegerOption(option =>
      option.setName('maxrolesdeleted')
        .setDescription('Max roles that can be deleted')
    )
    .addIntegerOption(option =>
      option.setName('maxrolechanges')
        .setDescription('Max role changes that can be made')
    )
    .addIntegerOption(option =>
      option.setName('maxchannelscreated')
        .setDescription('Max channels that can be created')
    )
    .addIntegerOption(option =>
      option.setName('maxrolescreated')
        .setDescription('Max roles that can be created')
    )
    .addIntegerOption(option =>
      option.setName('maxmentions')
        .setDescription('Max mentions in a message')
    )
    .addIntegerOption(option =>
      option.setName('maxnicknameschanged')
        .setDescription('Max nickname changes that can be made')
    )
    .addIntegerOption(option =>
      option.setName('maxbotsadded')
        .setDescription('Max bots that can be added')
    )
    .addIntegerOption(option =>
      option.setName('maxusersadded')
        .setDescription('Max users that can be added')
    )
    .addIntegerOption(option =>
      option.setName('maxchannelrenames')
        .setDescription('Max channel renames that can be made')
    )
    .addIntegerOption(option =>
      option.setName('maxcategoriescreated')
        .setDescription('Max categories that can be created')
    )
    .addIntegerOption(option =>
      option.setName('maxcategoryrenames')
        .setDescription('Max category renames that can be made')
    )
    .addIntegerOption(option =>
      option.setName('maxwebhookmessages')
        .setDescription('Max webhook messages in a timeframe')
    )
    .addIntegerOption(option =>
      option.setName('timeframe')
        .setDescription('Time frame for tracking actions in milliseconds')
    ),

  async execute(interaction) {
    const userId = interaction.user.id;

    // Check if the user is authorized
    if (!authorizedUsers.includes(userId)) {
      await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      return;
    }

    const guildId = interaction.guild.id;
    const enabled = interaction.options.getBoolean('enabled');
    const adminRole = interaction.options.getRole('adminrole');
    const maxChannelsDeleted = interaction.options.getInteger('maxchannelsdeleted');
    const maxRolesDeleted = interaction.options.getInteger('maxrolesdeleted');
    const maxRoleChanges = interaction.options.getInteger('maxrolechanges');
    const maxChannelsCreated = interaction.options.getInteger('maxchannelscreated');
    const maxRolesCreated = interaction.options.getInteger('maxrolescreated');
    const maxMentions = interaction.options.getInteger('maxmentions');
    const maxNicknamesChanged = interaction.options.getInteger('maxnicknameschanged');
    const maxBotsAdded = interaction.options.getInteger('maxbotsadded');
    const maxUsersAdded = interaction.options.getInteger('maxusersadded');
    const maxChannelRenames = interaction.options.getInteger('maxchannelrenames');
    const maxCategoriesCreated = interaction.options.getInteger('maxcategoriescreated');
    const maxCategoryRenames = interaction.options.getInteger('maxcategoryrenames');
    const maxWebhookMessages = interaction.options.getInteger('maxwebhookmessages');
    const timeFrame = interaction.options.getInteger('timeframe');

    if (!adminRole) {
      await interaction.reply({ content: 'Admin role is required to configure anti-nuke settings.', ephemeral: true });
      return;
    }

    try {
      let settings = await ServerSettings.findOne({ guildId });

      if (!settings) {
        settings = new ServerSettings({
          guildId,
          adminRole: adminRole.id,
          enabled: enabled ?? true,
          maxChannelsDeleted: maxChannelsDeleted ?? 3,
          maxRolesDeleted: maxRolesDeleted ?? 3,
          maxRoleChanges: maxRoleChanges ?? 3,
          maxChannelsCreated: maxChannelsCreated ?? 3,
          maxRolesCreated: maxRolesCreated ?? 3,
          maxMentions: maxMentions ?? 5,
          maxNicknamesChanged: maxNicknamesChanged ?? 3,
          maxBotsAdded: maxBotsAdded ?? 3,
          maxUsersAdded: maxUsersAdded ?? 5,
          maxChannelRenames: maxChannelRenames ?? 3,
          maxCategoriesCreated: maxCategoriesCreated ?? 3,
          maxCategoryRenames: maxCategoryRenames ?? 3,
          maxWebhookMessages: maxWebhookMessages ?? 5,
          timeFrame: timeFrame ?? 60000,
        });
      } else {
        if (enabled !== null) settings.enabled = enabled;
        if (adminRole) settings.adminRole = adminRole.id;
        if (maxChannelsDeleted !== null) settings.maxChannelsDeleted = maxChannelsDeleted;
        if (maxRolesDeleted !== null) settings.maxRolesDeleted = maxRolesDeleted;
        if (maxRoleChanges !== null) settings.maxRoleChanges = maxRoleChanges;
        if (maxChannelsCreated !== null) settings.maxChannelsCreated = maxChannelsCreated;
        if (maxRolesCreated !== null) settings.maxRolesCreated = maxRolesCreated;
        if (maxMentions !== null) settings.maxMentions = maxMentions;
        if (maxNicknamesChanged !== null) settings.maxNicknamesChanged = maxNicknamesChanged;
        if (maxBotsAdded !== null) settings.maxBotsAdded = maxBotsAdded;
        if (maxUsersAdded !== null) settings.maxUsersAdded = maxUsersAdded;
        if (maxChannelRenames !== null) settings.maxChannelRenames = maxChannelRenames;
        if (maxCategoriesCreated !== null) settings.maxCategoriesCreated = maxCategoriesCreated;
        if (maxCategoryRenames !== null) settings.maxCategoryRenames = maxCategoryRenames;
        if (maxWebhookMessages !== null) settings.maxWebhookMessages = maxWebhookMessages;
        if (timeFrame !== null) settings.timeFrame = timeFrame;
      }

      await settings.save();

      await interaction.reply('Anti-nuke settings updated successfully!');
    } catch (error) {
      console.error('Error updating anti-nuke settings:', error);
      await interaction.reply({ content: 'There was an error updating the anti-nuke settings. Please try again later.', ephemeral: true });
    }
  },
};
