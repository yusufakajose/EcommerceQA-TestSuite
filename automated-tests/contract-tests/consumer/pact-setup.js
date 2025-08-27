const { Pact } = require('@pact-foundation/pact');
const path = require('path');

global.pact = new Pact({
  consumer: 'EcommerceWebApp',
  provider: 'ProductService',
  port: 1234,
  log: path.resolve(process.cwd(), 'logs', 'pact.log'),
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'INFO',
});
