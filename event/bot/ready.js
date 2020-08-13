const Logger = require('@lilywonhalf/pretty-logger');
const Config = require('../../config.json');
const Guild = require('../../model/guild');

module.exports = async () => {
    Logger.info('Logged in as ' + bot.user.username + '#' + bot.user.discriminator);

    Logger.info('--------');

    Logger.info('Syncing guilds...');
    await Guild.init();
    Logger.info(`Guilds synced. Serving in ${bot.guilds.cache.size} guild(s)`);

    Logger.info('--------');

    if (process.argv[3] === '--reboot') {
        Config.mom.send('Je suis de retour :) !');
    }
};
