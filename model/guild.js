const Logger = require('@lilywonhalf/pretty-logger');
const Discord = require('discord.js');

const MESSAGES_TO_CACHE_AMOUNT = 10000;

const Guild = {
    /** {Collection} */
    messagesCache: new Discord.Collection(),

    init: async () => {
        await Guild.cacheAllMessages();
    },

    cacheAllMessages: async () => {
        const channels = bot.guilds.cache.reduce(
            (carry, guild) => carry === null ? guild.channels.cache : carry.concat(guild.channels.cache),
            null
        );

        await Promise.all(
            channels.filter(channel => channel.type === 'text').array().map(
                channel => Guild.cacheChannelMessages(channel, MESSAGES_TO_CACHE_AMOUNT)
            )
        );
    },

    /**
     * @param {Guild} guild
     */
    cacheGuildMessages: async (guild) => {
        Logger.info(`Syncing guild ${guild.name} messages...`);

        await Promise.all(
            guild.channels.cache.filter(channel => channel.type === 'text').array().map(
                channel => Guild.cacheChannelMessages(channel, MESSAGES_TO_CACHE_AMOUNT)
            )
        );

        Logger.info(`Guild ${guild.name}'s messages synced!`);
    },

    /**
     * @param {TextChannel} textChannel
     * @param {int} amount
     */
    cacheChannelMessages: async (textChannel, amount) => {
        let lastFetched = null;
        let messages = null;

        do {
            const options = {
                limit: Math.min(amount, 100) // 100 is the maximum Discord API can fetch at once
            };

            if (lastFetched !== null) {
                options.before = lastFetched;
            }

            messages = await textChannel.messages.fetch(options).catch(Logger.exception);

            if (messages !== null && messages.size > 0) {
                lastFetched = messages.last().id;
                Guild.messagesCache = Guild.messagesCache.concat(messages);
            }

            amount -= options.limit;
        } while (amount > 0 || messages === null || messages.size > 0);
    },

    /**
     * @param message
     * @returns {Promise.<GuildMember|null>}
     */
    getMemberFromMessage: async (message) => {
        return message.guild !== null ? await message.guild.members.fetch(message.author).catch(exception => {
            Logger.error(exception.toString());

            return null;
        }) : null;
    },

    /**
     * @param {GuildMember} member
     */
    isMemberAdmin: (member) => {
        return member !== undefined && member !== null && member.hasPermission(Discord.Permissions.FLAGS.ADMINISTRATOR);
    },

    /**
     * @param {GuildMember} member
     * @param {Snowflake} snowflake - The Role snowflake.
     * @returns {boolean}
     */
    memberHasRole: (member, snowflake) => {
        return member !== undefined && member !== null && member.roles.cache.some(role => role.id === snowflake);
    },

    /**
     * @param {Message} message
     * @returns {Discord.MessageEmbed}
     */
    messageToEmbed: async (message) => {
        const member = await Guild.getMemberFromMessage(message);
        const suffix = member !== null && member.nickname !== null && member.nickname !== undefined ? ` aka ${member.nickname}` : '';
        const embeds = message.embeds.filter(embed => embed.description.trim().length > 0);

        let authorName = `${message.author.username}#${message.author.discriminator}${suffix}`;
        let authorImage = message.author.displayAvatarURL({ dynamic: true });
        let description = message.content;
        let timestamp = message.createdTimestamp;

        if (description.length < 1 && embeds.length > 0 && typeof embeds[0].description !== 'undefined') {
            description = embeds[0].description.trim();

            if (message.author.bot) {
                if (embeds[0].author) {
                    authorName = embeds[0].author.name;
                    authorImage = embeds[0].author.iconURL;
                }

                if (embeds[0].timestamp) {
                    timestamp = embeds[0].timestamp;
                }
            }
        }

        return new Discord.MessageEmbed()
            .setAuthor(authorName, authorImage)
            .setColor(0x00FF00)
            .setDescription(description)
            .setTimestamp(timestamp);
    },

    /**
     * @param {Message} message
     * @returns {{certain: boolean, foundMembers: Array}}
     */
    findDesignatedMemberInMessage: (message) => {
        let foundMembers = [];
        let certain = true;
        let memberList = bot.users.cache;

        if (message.guild !== null) {
            memberList = memberList.concat(message.guild.members.cache);
        }

        if (message.mentions.members !== null && message.mentions.members.size > 0) {
            foundMembers = message.mentions.members.array();
        } else if (message.content.match(/[0-9]{18}/u) !== null) {
            const ids = message.content.match(/[0-9]{18}/gu);

            ids.map(id => {
                if (memberList.has(id)) {
                    foundMembers.push(memberList.get(id));
                }
            });
        } else {
            certain = false;
            memberList.forEach(member => {
                const user = member.user === undefined ? member : member.user;

                const hasNickname = member.nickname !== undefined && member.nickname !== null;
                const nickname = hasNickname ? `${member.nickname.toLowerCase()}#${user.discriminator}` : '';
                const username = `${user.username.toLowerCase()}#${user.discriminator}`;
                const content = message.cleanContent.toLowerCase().split(' ').splice(1).join(' ');

                if (content.length > 0) {
                    const contentInNickname = hasNickname ? nickname.indexOf(content) > -1 : false;
                    const contentInUsername = username.indexOf(content) > -1;
                    const nicknameInContent = hasNickname ? content.indexOf(nickname) > -1 : false;
                    const usernameInContent = content.indexOf(username) > -1;

                    if (contentInNickname || contentInUsername || nicknameInContent || usernameInContent) {
                        foundMembers.push(member);
                    }
                }
            });
        }

        return {
            certain,
            foundMembers
        };
    }
};

module.exports = Guild;