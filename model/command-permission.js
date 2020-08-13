const Config = require('../config.json');
const Guild = require('./guild');

const CommandPermission = {
    /**
     * @param {Message} message
     * @returns {Promise.<boolean>}
     */
    isMommy: async (message) => {
        return message.author.id === Config.mom;
    },

    /**
     * @param {Message} message
     * @returns {Promise.<boolean>}
     */
    isMemberAdmin: async (message) => {
        const member = await Guild.getMemberFromMessage(message);

        return await Guild.isMemberAdmin(member);
    },

    /**
     * @param {Message} message
     * @returns {Promise.<boolean>}
     */
    yes: async (message) => {
        return true;
    }
};

module.exports = CommandPermission;
