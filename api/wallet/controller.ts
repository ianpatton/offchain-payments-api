import {Request, ResponseToolkit} from '@hapi/hapi';
import {getAddress} from 'ethers';

import {IExtendedServerApplicationState} from '../../hapi-plugins/hapi-postgres';

export async function getWallet(req: Request, h: ResponseToolkit) {
  const {chainId, tokenAddress, walletAddress} = req.params;

  const tokenChksum = getAddress(tokenAddress);
  const walletChksum = getAddress(walletAddress);

  const app = <IExtendedServerApplicationState>req.server.app;

  const wallet = await app.db.models.Wallet.findOrCreate({
    where: {cid: chainId, t: tokenChksum, a: walletChksum},
  });

  return h.response(wallet);
}
