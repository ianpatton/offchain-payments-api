import {server} from '@hapi/hapi';

import {routes as paymentRoutes} from './api/payment/routes';

const init = async () => {
  const service = server({
    port: 3000,
    host: '0.0.0.0',
  });

  service.route(paymentRoutes);

  await service.start();
  console.log('Server running on %s', service.info.uri);
};

init();
