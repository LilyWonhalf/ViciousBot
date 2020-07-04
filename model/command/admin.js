const Config = require('../../config.json');
const CommandCategory = require('../command-category');
const CommandPermission = require('../command-permission');
const Guild = require('../guild');

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

        if (result.certain) {
            await Promise.all(result.foundMembers.map(async member => {
                if (!Guild.memberHasRole(member, Config.roles.admin)) {
                    await member.roles.add(Config.roles.admin);
                }
            }));

            await message.react(emoji);
        } else {
            message.reply('I am sorry, I am not sure who you are talking about. You may try again with mentions, or IDs.');
        }
    }
}

module.exports = new Admin();
