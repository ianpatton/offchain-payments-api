import {Schema, model} from 'mongoose';

import {isAddress, isHexString} from 'ethers';

const validateEthereumAddress = {
  validator: isAddress,
  message: (props: {value: string}) => `${props.value} is not a valid address`,
};

const validateHexValue = {
  validator: (v: string) => isHexString(v),
  message: (props: {value: string}) => `${props.value} is not a valid value`,
};

export interface IPayment {
  cid: number; //chainId
  ts: Date; //timestamp
  type: 'd' | 't' | 'w'; //deposit, transfer, or withdrawal
  from: string;
  token: string;
  nonce: string;
  to: string;
  val: string; //value transferred
  sig: string; //signature
}

export function getEIP712(doc: IPayment) {
  const types = {
    EIP712Domain: [
      {name: 'name', type: 'string'},
      {name: 'version', type: 'string'},
      {name: 'chainId', type: 'uint256'},
      {name: 'salt', type: 'bytes32'},
    ],
    Transfer: [
      {name: 'token', type: 'string'},
      {name: 'to', type: 'string'},
      {name: 'value', type: 'string'},
    ],
  };

  return {
    domain: {
      name: 'Test.com',
      version: '1',
      chainId: doc.cid,
      salt: Buffer.from(doc.nonce),
    },
    types,
    primaryType: <'Transfer' | 'EIP712Domain'>'Transfer',
    message: {
      token: doc.token,
      to: doc.to,
      value: doc.val,
    },
  };
}

const schema = new Schema<IPayment>({
  cid: {type: Number, required: true},
  ts: {type: Date, default: Date.now},
  type: {type: String, enum: ['d', 't', 'w'], required: true},
  from: {
    type: String,
    required: true,
    validate: validateEthereumAddress,
  },
  token: {
    type: String,
    required: true,
    validate: validateEthereumAddress,
  },
  nonce: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
    validate: validateEthereumAddress,
  },
  val: {
    type: String,
    required: true,
    validate: validateHexValue,
  },
  sig: {
    type: String,
    required: true,
  },
});

schema.index({cid: 1, from: 1, nonce: 1}, {unique: true});

export const Payment = model<IPayment>('Payment', schema);
