import * as Joi from 'joi';
import {isAddress, isHexString} from 'ethers';
import {newPayment} from './controller';

export const routes = [
  {
    method: 'POST',
    path: '/api/payment',
    config: {
      handler: newPayment,
      validate: {
        payload: Joi.object({
          cid: Joi.number().positive().required().description('The Chain ID'),
          type: Joi.string()
            .required()
            .valid(['t', 'w'])
            .description(
              'Type of transaction: "t" for transfer, or "w" for withdrawal'
            ),
          from: Joi.string()
            .custom(a => isAddress(a), 'Not a valid address')
            .required()
            .description('The from address'),
          token: Joi.string()
            .custom(a => isAddress(a), 'Not a valid address')
            .required(),
          nonce: Joi.string()
            .custom(a => isHexString(a), 'Not a valid hex string')
            .required(),
          to: Joi.string()
            .custom(a => isAddress(a), 'Not a valid address')
            .required()
            .description('The to address'),
          val: Joi.string()
            .custom(a => isHexString(a), 'Not a valid hex string')
            .required()
            .description('The amount to send in hex'), //value transferred
          sig: Joi.string().description('An EIP-712 signed message'), //signature
        }),
      },
    },
  },
];
