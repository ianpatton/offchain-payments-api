# Offchain Payments API

This is an API for interacting with https://github.com/dmidnight/merkle-commitments-contract

This repo includes an API and a deposit monitor. The deposit monitor watches for deposits to the contract, and replicates them into a local database, adjusting the offchain wallet balance.

With an offchain balance, users can send ERC-20 and native gas tokens to each other with no fees. This is achieved by signing an EIP-712 formatted message that includes the chainId, tokenAddress, the recipient, the amount to send, and a nonce. These signatures are unique, and cannot be replayed, even on another chain, due to the inclusion of the chainId and nonce in each signature.

Users can choose to withdraw their balance back to the main chain. When a withdraw is requested, their offchain balance is reduced, and the user must await the next merkle commitment be proposed and validated. (This is much like waiting on the next block, or a confirmation onchain).

When a merkle commitment is proposed and validated, then users can withdraw the balance they previously requested by providing a merkle proof to the contract.

To avoid the need for every user to have gas tokens, deposits can be made on behalf of another user. Likewise, withdrawl requests gas costs can be paid by someone else. The withdrawal still goes to the original party. This allows both deposits and withdrawals to be provided as a service, and can be paid using offchain ERC-20 balances, for example.
