import * as Joi from 'joi';
import {isAddress} from 'ethers';

import {getNonce} from './controller';

export const routes = [
  {
    method: 'GET',
    path: '/api/nonce/{chainId}/{walletAddress}',
    config: {
      handler: getNonce,
      validate: {
        params: Joi.object({
          chainId: Joi.number()
            .positive()
            .required()
            .description('The Chain ID'),
          walletAddress: Joi.string()
            .custom(a => isAddress(a), 'Not a valid address')
            .required()
            .description('The wallet address'),
        }),
      },
    },
  },
];
