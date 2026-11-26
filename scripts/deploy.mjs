// GenLayer SourceCheck deploy (STUDIONET / testnet only). Reviewed 2026-11-26.
// Default = DRY RUN (no tx). Add the word "go" to actually deploy.  "demo <addr>" sends one check_claim write.
// Safety: chain is locked to studionet (id 61999, studio.genlayer.com). Address must equal adresler.json .evm.
// The private key is read internally from the same file the other reviewed scripts use and is never printed.
import fs from 'fs';
import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionStatus } from 'genlayer-js/types';

const PK = process.env.PRIVATE_KEY;
const mode = process.argv[2] || 'dry';
const GO = mode === 'go' || mode === 'demo';
if (!/^0x[0-9a-fA-F]{64}$/.test(PK || '')) throw new Error('set PRIVATE_KEY (throwaway testnet key)');
if (studionet.id !== 61999) throw new Error('unexpected chain id ' + studionet.id);
const account = createAccount(PK);

const client = createClient({ chain: studionet, account });
console.log('net studionet chainId', studionet.id, 'addr', account.address, 'mode', GO ? mode : 'DRY-RUN');
console.log('rpc', studionet.rpcUrls.default.http[0]);
const bal = await client.getBalance?.({ address: account.address }).catch(() => null);
console.log('balance (wei)', bal === null || bal === undefined ? 'n/a' : String(bal));

const fees = await client.estimateTransactionFees({
  leaderTimeunitsAllocation: 100n, validatorTimeunitsAllocation: 200n, rotations: [0n],
});
console.log('feeValue (wei)', String(fees.feeValue));
if (!GO) { console.log('DRY RUN done. Run: node scripts/deploy.mjs go'); process.exit(0); }

if (mode === 'go') {
  const code = new Uint8Array(fs.readFileSync(new URL('../contracts/source_check.py', import.meta.url)));
  const hash = await client.deployContract({ code, args: [], fees: { distribution: fees.distribution, feeValue: fees.feeValue } });
  console.log('deploy tx', hash);
  const r = await client.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, retries: 200 });
  console.log('status', r.statusName, 'result', r.resultName ?? '');
  const addr = r.txDataDecoded?.contractAddress ?? r.data?.contract_address;
  console.log('contract', addr);
} else {
  const addr = process.argv[3];
  if (!/^0x[0-9a-fA-F]{40}$/.test(addr || '')) throw new Error('need contract address');
  const claim = 'The GenLayer white paper describes Intelligent Contracts that can use LLMs and web data.';
  const url = 'https://docs.genlayer.com/';
  const hash = await client.writeContract({ address: addr, functionName: 'check_claim', args: [claim, url], fees: { distribution: fees.distribution, feeValue: fees.feeValue } });
  console.log('write tx', hash);
  const r = await client.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, retries: 200 });
  console.log('status', r.statusName);
  console.log('count', await client.readContract({ address: addr, functionName: 'get_count', args: [] }));
  console.log('check0', JSON.stringify(await client.readContract({ address: addr, functionName: 'get_check', args: [0] })));
}












































