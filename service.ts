import {server} from '@hapi/hapi';
import {plugin as HapiPostgres} from './hapi-plugins/hapi-postgres';
import {routes as transactionRoutes} from './api/transaction/routes';
import {routes as walletRoutes} from './api/wallet/routes';

export const service = server({
  port: 3000,
  host: '0.0.0.0',
});

// healthcheck route
service.route({
  method: 'GET',
  path: '/',
  handler: () => {
    return 'Ok';
  },
});

service.route(transactionRoutes);
service.route(walletRoutes);

let stopping = false;

export const start = async () => {
  await service.register([HapiPostgres]);
  await service.start();

  console.log('Server running on %s', service.info.uri);
};

export const stop = async () => {
  if (!stopping) {
    console.log('Stopping server...');
    stopping = true;
    await service.stop();
    console.log('Server stopped.');
  }
};
