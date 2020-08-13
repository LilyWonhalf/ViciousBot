const Discord = require('discord.js');
const Config = require('../../config.json');
const CommandCategory = require('../command-category');
const CommandPermission = require('../command-permission');
const Guild = require('../guild');

const ADMIN_ROLE_NAMES = [
    'administrator',
    'administration',
    'admin'
];

class Admin
{
    static instance = null;

    constructor() {
        if (Admin.instance !== null) {
            return Admin.instance;
        }

        this.aliases = [
            'adminify',
            'adminize',
            'makeadmin',
            'make-admin',
            'addadmin',
            'add-admin',
            'addmin'
        ];

        this.category = CommandCategory.ADMINISTRATION;
        this.isAllowedForContext = CommandPermission.isMemberAdmin;
        this.description = 'Adds the administrator role to one or multiple targeted member(s)';
    }

    /**
     * @param {Message} message
     */
    async process(message) {
        const emoji = bot.emojis.cache.find(emoji => emoji.name === 'pinkfire');
        const result = Guild.findDesignatedMemberInMessage(message);

        const adminRole = message.guild.roles.cache.sorted((a, b) => a.rawPosition - b.rawPosition).find(role => {
            const isNotManaged = !role.managed;
            const hasAdminPermission = role.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR);
            const hasAdminName = ADMIN_ROLE_NAMES.includes(role.name.toLowerCase());

            return isNotManaged && (hasAdminPermission || hasAdminName);
        });

        if (typeof adminRole !== 'undefined') {
            if (result.certain) {
                await Promise.all(result.foundMembers.map(async member => {
                    if (!Guild.memberHasRole(member, adminRole)) {
                        await member.roles.add(adminRole).catch(error => {
                            message.reply(`I am sorry, I do not seem to be able to assign that role to someone. Please make sure that my highest role is higher than the role named "${adminRole.name}".`);
                        });
                    }
                }));

                await message.react(emoji);
            } else {
                message.reply('I am sorry, I am not sure who you are talking about. You may try again with mentions, or IDs.');
            }
        } else {
            message.reply('I am sorry, I could not find any admin role. If you have one, please make sure it has the "Administrator" permission checked, or that it is named either "Administrator", "Administration", or "Admin".');
        }
    }
}

module.exports = new Admin();
