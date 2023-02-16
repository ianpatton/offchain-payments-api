import * as Joi from 'joi';
import {isAddress, isHexString} from 'ethers';
import {newTransaction} from './controller';

const testAddress = (a: string) => {
  if (!isAddress(a)) {
    throw new Error('Not an address');
  }
  return a;
};

const testHex = (a: string) => {
  if (!isHexString(a)) {
    throw new Error('Not a hex value');
  }
  return a;
};

export const routes = [
  {
    method: 'POST',
    path: '/api/transaction',
    config: {
      handler: newTransaction,
      validate: {
        payload: Joi.object({
          cid: Joi.string()
            .custom(testHex, 'Not a valid hex string')
            .required()
            .description('The Chain ID'),
          type: Joi.string()
            .required()
            .valid('t', 'w')
            .description(
              'Type of transaction: "t" for transfer, or "w" for withdrawal'
            ),
          from: Joi.string()
            .custom(testAddress, 'Not a valid address')
            .required()
            .description('The from address'),
          token: Joi.string()
            .custom(testAddress, 'Not a valid address')
            .required(),
          nonce: Joi.string()
            .custom(testHex, 'Not a valid hex string')
            .required(),
          to: Joi.string()
            .custom(testAddress, 'Not a valid address')
            .required()
            .description('The to address'),
          val: Joi.string()
            .custom(testHex, 'Not a valid hex string')
            .required()
            .description('The amount to send in hex'), //value transferred
          sig: Joi.string().description('An EIP-712 signed message'), //signature
        }),
      },
    },
  },
];
