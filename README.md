# SourceCheck: a GenLayer Intelligent Contract

Small public-good contract. Anyone submits a short factual claim and a source URL.
GenLayer validators each fetch the page, ask an LLM whether the text supports the claim, and must
agree on the verdict (`SUPPORTED`, `NOT_SUPPORTED` or `UNCLEAR`) through the equivalence principle
(`prompt_comparative`). The verdict is stored on-chain with the claim, URL and submitter.

No funds, no payouts, no betting. It only records a validator-agreed verdict.

## Files
- `contracts/source_check.py`: the contract (runner `py-genlayer:kzybg95x...`, GenVM v0.4)
- `scripts/deploy.mjs`: deploy and demo script using `genlayer-js` 2.0 (Studionet; dry-run by default)

## Deploy
```bash
npm i genlayer-js@2.0.0
PRIVATE_KEY=0x... node scripts/deploy.mjs          # dry run
PRIVATE_KEY=0x... node scripts/deploy.mjs go       # deploy to Studionet
PRIVATE_KEY=0x... node scripts/deploy.mjs demo 0xCONTRACT
```
Use a throwaway testnet key only.

## Contract API
- `check_claim(claim: str, url: str)` (write)
- `get_count() -> int` (view)
- `get_check(index: int) -> dict` (view)

## Studionet deployment
- Contract: `0x4ADD8368441CB8be8582645eCaaF49Fc4828Ec82` (chain 61999, studio.genlayer.com)
- Deploy tx: `0x96a23ed787d49b96845310be2417b6c4b31d62516161026bf6210170680aee15`
- Demo write tx: `0x32277e124bf68d73ecf8e355ecda11274d73d16593cfe29a91479c544e4caf4e`

MIT licensed.


























