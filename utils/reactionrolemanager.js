const { GuildMember, MessageReaction, User, ChannelType } = require('discord.js');

/**
 * @typedef {Object} Config
 * @property {Object.<string, string[]>} emojiRoleMap
 * @property {'once' | 'any' | 'unique'} policy
 * @property {boolean} removeReaction
 */

class ReactionRoleManager {
  /**
   * @param {MessageReaction} messageReaction
   * @param {User} user
   * @param {Config} config
   */
  constructor(messageReaction, user, config) {
    this.messageReaction = messageReaction;
    this.user = user;
    this.config = config;
    this.roleIds = undefined;
    this.member = undefined;
  }

  get emoji() {
    return this.messageReaction.emoji.id || this.messageReaction.emoji.name;
  }

  get ruleRoleIds() {
    return [...new Set(Object.values(this.config.emojiRoleMap).flat())];
  }

  async setRoles() {
    if (!(await this._validateInput())) {
      return;
    }

    await this._handleUserReaction();

    switch (this.config.policy) {
      case 'once':
        return this._memberHasSomeRoleInRuleRoles()
          ? undefined
          : this._addRolesToMember();
      case 'any':
        return this._memberHasEveryRoleInRoles()
          ? this._removeRolesFromMember()
          : this._addRolesToMember();
      case 'unique':
      default:
        return this._memberHasEveryRoleInRoles()
          ? this._removeRolesFromMember()
          : this._setRolesToMember();
    }
  }

  async _validateInput() {
    if (!this.config || this.user.bot || this.messageReaction.message.channel.type === ChannelType.DM) {
      return false;
    }

    if (!this._setRoleIds() || !(await this._setMember())) {
      return false;
    }

    return true;
  }

  _setRoleIds() {
    this.roleIds = this.config.emojiRoleMap[this.emoji];
    return Boolean(this.roleIds);
  }

  async _setMember() {
    this.member = await this.messageReaction.message.guild?.members.fetch(this.user);
    return Boolean(this.member);
  }

  async _handleUserReaction() {
    if (this.config.removeReaction) {
      this.messageReaction.users.remove(this.user);
    }
  }

  _memberHasSomeRoleInRuleRoles() {
    return this.ruleRoleIds.some(roleId => this.member.roles.cache.has(roleId));
  }

  _memberHasEveryRoleInRoles() {
    return this.roleIds.every(roleId => this.member.roles.cache.has(roleId));
  }

  async _removeRolesFromMember() {
    this.member.roles.remove(this.roleIds);
  }

  async _addRolesToMember() {
    this.member.roles.add(this.roleIds);
  }

  async _setRolesToMember() {
    const currentRoleIds = this.member.roles.cache.map(role => role.id);
    const roleIdsToSet = [
      ...currentRoleIds.filter(roleId => !this.ruleRoleIds.includes(roleId)),
      ...this.roleIds,
    ];
    this.member.roles.set(roleIdsToSet);
  }
}

module.exports = { ReactionRoleManager };
