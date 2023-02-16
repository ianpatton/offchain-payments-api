import * as Joi from 'joi';
import {isAddress} from 'ethers';

import {getWallet} from './controller';

const testAddress = (a: string) => {
  if (!isAddress(a)) {
    throw new Error('Not an address');
  }
  return a;
};

export const routes = [
  {
    method: 'GET',
    path: '/api/wallet/{chainId}/{tokenAddress}/{walletAddress}',
    config: {
      handler: getWallet,
      validate: {
        params: Joi.object({
          chainId: Joi.number()
            .positive()
            .required()
            .description('The Chain ID'),
          tokenAddress: Joi.string()
            .custom(testAddress, 'Not a valid address')
            .required()
            .description('The token contract address'),
          walletAddress: Joi.string()
            .custom(testAddress, 'Not a valid address')
            .required()
            .description('The wallet address'),
        }),
      },
    },
  },
];
