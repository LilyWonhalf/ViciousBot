const Logger = require('@lilywonhalf/pretty-logger');
const CommandCategory = require('../command-category');
const CommandPermission = require('../command-permission');

class Kill
{
    static instance = null;

    constructor() {
        if (Kill.instance !== null) {
            return Kill.instance;
        }

        this.aliases = [];
        this.category = CommandCategory.BOT_MANAGEMENT;
        this.isAllowedForContext = CommandPermission.isMemberAdmin;
        this.description = 'Kills the bot process';
    }

    /**
     * @param {Message} message
     */
    async process(message) {
        const emoji = bot.emojis.cache.find(emoji => emoji.name === 'pinkfire');

        await message.react(emoji);
        Logger.notice('killbotpls');
    }
}

module.exports = new Kill();
