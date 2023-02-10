import {server} from '@hapi/hapi';
import {plugin as HapiMongoose} from './hapi-plugins/hapi-mongoose';
import {routes as paymentRoutes} from './api/payment/routes';

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

service.route(paymentRoutes);

let stopping = false;

export const start = async () => {
  await service.register([HapiMongoose]);
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
