import {Request, ResponseToolkit} from '@hapi/hapi';
import {getAddress} from 'ethers';

import {Balance} from '../../models/Balance';

export async function getBalance(req: Request, h: ResponseToolkit) {
  const {chainId, tokenAddress, walletAddress} = req.params;

  const tokenChksum = getAddress(tokenAddress);
  const walletChksum = getAddress(walletAddress);

  const balance = await Balance.findOne({
    cid: chainId,
    t: tokenChksum,
    a: walletChksum,
  });

  return h.response({
    balance: balance?.b ? balance.b : `0x${BigInt(0).toString(16)}`,
  });
}
