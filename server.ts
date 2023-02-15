import * as dotenv from 'dotenv';
dotenv.config();

import {start, stop} from './service';

process.on('SIGTERM', stop);
process.on('SIGINT', stop);

start();
