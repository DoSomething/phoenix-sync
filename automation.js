const CronJob = require('cron').CronJob;

console.info('Running automation script...');

const job = new CronJob('* * */12 * * *', () => {
  require('./');
}, null, true, 'America/New_York');

const http = require('http');

// Dummy server to make Heroku not panic.
const server = http.createServer((req, res) => {
  res.end();
});

server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(process.env.PORT || 5000);
