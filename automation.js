const CronJob = require('cron').CronJob;

console.info('Running automation script...');

const job = new CronJob('* * */12 * * *', () => {
  require('./');
}, null, true, 'America/New_York');
