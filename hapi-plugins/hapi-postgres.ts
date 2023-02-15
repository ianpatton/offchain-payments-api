import {Sequelize} from 'sequelize';
import {Server, ServerApplicationState} from '@hapi/hapi';

import {initModels} from '../models';

export interface IExtendedServerApplicationState
  extends ServerApplicationState {
  db: Sequelize;
}

export const plugin = {
  name: 'hapi-postgres',
  version: '1.0.0',
  register: async function (server: Server) {
    server.ext({
      type: 'onPreStart',
      method: async () => {
        const app = <IExtendedServerApplicationState>server.app;
        console.info('Creating db connection');
        const sequelize = new Sequelize(
          `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`
        );
        await sequelize.authenticate();
        initModels(sequelize);
        await sequelize.sync();
        app.db = sequelize;
      },
    });

    server.ext({
      type: 'onPostStop',
      method: async () => {
        const app = <IExtendedServerApplicationState>server.app;
        if (app.db) {
          await app.db.close();
          console.info('Closed db connection');
        }
      },
    });
  },
};
