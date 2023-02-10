import mongoose from 'mongoose';
mongoose.set('strictQuery', false);

import {Server} from '@hapi/hapi';
import * as pkg from '../package.json';

export const plugin = {
  name: 'hapi-mongoose',
  version: '1.0.0',
  register: async function (server: Server) {
    server.ext({
      type: 'onPreStart',
      method: async () => {
        const connString = `${
          process.env.MONGO ||
          'mongodb://127.0.0.1:27017/' + pkg.name + '?replicaSet=rs1'
        }`;
        console.info('Connecting mongoose...');
        await mongoose.connect(connString);
        console.info('Connected mongoose.');
      },
    });

    server.ext({
      type: 'onPreStop',
      method: async () => {
        console.info('Disconnecting mongoose...');
        await mongoose.disconnect();
        console.info('Disconnected mongoose.');
      },
    });
  },
};
