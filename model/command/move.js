const Logger = require('@lilywonhalf/pretty-logger');
const Discord = require('discord.js');
const Config = require('../../config');
const CommandCategory = require('../command-category');
const CommandPermission = require('../command-permission');
const Guild = require('../guild');

const moveMessage = async (message, channel) => {
    const messageReplica = await Guild.messageToEmbed(message);

    await channel.send(messageReplica);
    await message.delete();
};

const doMove = async (data) => {
    const { firstMessage, lastMessage, channel } = data;

    if (lastMessage === null) {
        await moveMessage(firstMessage, channel);
    } else {
        const originChannel = firstMessage.channel;
        let messagesBuffer = [lastMessage];
        let lastFetched = null;
        let messages = null;
        let firstMessageReached = false;

        do {
            const options = {
                limit: 100 // 100 is the maximum Discord API can fetch at once
            };

            if (lastFetched !== null) {
                options.before = lastFetched;
            } else {
                options.before = lastMessage.id;
            }

            const fetchedMessages = await originChannel.messages.fetch(options).catch(Logger.exception);
            messages = new Discord.Collection();

            fetchedMessages.forEach(message => {
                firstMessageReached = firstMessageReached || message.id === firstMessage.id;

                if (!firstMessageReached) {
                    lastFetched = message.id;
                    messagesBuffer.push(message)
                }
            });
        } while (!firstMessageReached);

        messagesBuffer.push(firstMessage);
        messagesBuffer = messagesBuffer.reverse();

        await Promise.all(messagesBuffer.map(message => moveMessage(message, channel)));
    }
};

class Move
{
    static instance = null;

    constructor() {
        if (Move.instance !== null) {
            return Move.instance;
        }

        this.aliases = [];
        this.category = CommandCategory.ADMINISTRATION;
        this.isAllowedForContext = CommandPermission.isMemberAdmin;
        this.description = 'Moves one or multiple messages from one channel to another';
    }

    /**
     * @param {Message} message
     * @param {Array} args
     */
    async process(message, args) {
        const loadingEmoji = bot.emojis.cache.find(emoji => emoji.name === 'loading');
        const doneEmoji = bot.emojis.cache.find(emoji => emoji.name === 'pinkfire');
        const data = { firstMessage: null, lastMessage: null, channel: null };

        args = args.join(' ').trim().replace(/ {2,}/ug, ' ').split(' ');

        if (args.length < 2) {
            message.reply('❌ You have to call that command with one or two message IDs and a channel mention');
            return;
        }

        if (args[0].match(/\d{18}/u) === null) {
            message.reply(`❌ The first argument doesn't seem to be a message ID, but it should be`);
            return;
        }

        if (message.mentions.channels.size < 1) {
            message.reply(`❌ Couldn't find any channel mention, there should be one`);
            return;
        }

        data.channel = message.mentions.channels.first();
        data.firstMessage = args[0];

        if (args.length > 2 && args[1] !== args[0]) {
            if (args[1].match(/\d{18}/u) === null) {
                message.reply(`❌ The second argument doesn't seem to be a message ID, but it should be, considering that you have three arguments`);
                return;
            }

            data.lastMessage = args[1];
        }

        let firstMessage = null;
        let lastMessage = null;

        if (data.firstMessage !== null) {
            if (Guild.messagesCache.has(data.firstMessage)) {
                firstMessage = Guild.messagesCache.get(data.firstMessage);
            } else {
                message.reply(`❌ The first message seems to be too old for me to be able to find it :( . ${bot.users.cache.get(Config.mom).toString()}`);
                return;
            }
        }

        if (data.lastMessage !== null) {
            if (Guild.messagesCache.has(data.lastMessage)) {
                lastMessage = Guild.messagesCache.get(data.lastMessage);
            } else {
                message.reply(`❌ The last message seems to be too old for me to be able to find it :( . ${bot.users.cache.get(Config.mom).toString()}`);
                return;
            }
        }

        if (lastMessage !== null) {
            if (lastMessage.createdTimestamp < firstMessage.createdTimestamp) {
                data.firstMessage = lastMessage;
                data.lastMessage = firstMessage;
            } else {
                data.firstMessage = firstMessage;
                data.lastMessage = lastMessage;
            }
        } else {
            data.firstMessage = firstMessage;
            data.lastMessage = null;
        }

        if (data.lastMessage !== null && data.firstMessage.channel.id !== data.lastMessage.channel.id) {
            message.reply(`❌ Both messages don't seem to be in the same channel, but they have to be`);
            return;
        }

        await message.react(loadingEmoji);
        await doMove(data);
        await message.reactions.removeAll();
        await message.react(doneEmoji);
    }
}

module.exports = new Move();
