import {Request, ResponseToolkit} from '@hapi/hapi';
import {getAddress} from 'ethers';

import {Nonce} from '../../models/Nonce';

export async function getNonce(req: Request, h: ResponseToolkit) {
  const {chainId, walletAddress} = req.params;

  const walletChksum = getAddress(walletAddress);

  const nonce = await Nonce.findOne({
    cid: chainId,
    a: walletChksum,
  });

  return h.response({
    nonce: nonce?.n ? nonce.n : 0,
  });
}
