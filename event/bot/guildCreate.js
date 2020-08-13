const Logger = require('@lilywonhalf/pretty-logger');
const Guild = require('../../model/guild');

/**
 * @param {Guild} guild
 */
module.exports = async (guild) => {
    Logger.info(`New guild: ${guild.name}`);
    Logger.info(`Now in ${bot.guilds.cache.size} guild(s)!`);
    Guild.cacheGuildMessages(guild);
};
