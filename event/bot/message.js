const Command = require('../../model/command');
const Guild = require('../../model/guild');

/**
 * @param {Message} message
 */
module.exports = async (message) => {
    const user = message.author;

    Guild.messagesCache.set(message.id, message);

    if (!user.bot) {
        await Command.parseMessage(message);
    }
};
