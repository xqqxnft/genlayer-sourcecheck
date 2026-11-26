# v0.4.0
# { "Depends": "py-genlayer:kzybg95x1gn21dw72m7hyg0maaap04n4nx55j9yt6fkdqxtz6bz0" }

# SourceCheck: a small public-good intelligent contract.
# Anyone submits a short factual claim plus a source URL. Validators independently fetch the page,
# ask an LLM whether the page text supports the claim, and must agree on the verdict
# (SUPPORTED / NOT_SUPPORTED / UNCLEAR). The verdict is stored on-chain with the claim and URL.
# No funds, no payouts, no betting: it only records a validated verdict.

import json
from dataclasses import dataclass

import genlayer as gl
from genlayer.types import *
from genlayer.storage import DynArray, TreeMap

VERDICTS = ("SUPPORTED", "NOT_SUPPORTED", "UNCLEAR")


@gl.storage.allow
@dataclass
class Check:
    claim: str
    url: str
    verdict: str
    reason: str
    submitter: Address


class SourceCheck(gl.contract.Contract):
    checks: TreeMap[u256, Check]
    count: u256

    def __init__(self):
        self.count = u256(0)

    @gl.public.write
    def check_claim(self, claim: str, url: str) -> None:
        if len(claim) == 0 or len(claim) > 300:
            raise gl.vm.UserError("[EXPECTED] claim must be 1-300 chars")
        if not (url.startswith("https://") or url.startswith("http://")):
            raise gl.vm.UserError("[EXPECTED] url must start with http(s)://")

        def judge() -> str:
            page = gl.nondet.web.render(url, mode="text")
            page = page[:6000]
            task = f"""You are a careful fact-checking assistant.
Claim: {claim}

Source page text (may be truncated):
{page}

Decide if the source text supports the claim.
Answer with JSON only: {{"verdict": "SUPPORTED" | "NOT_SUPPORTED" | "UNCLEAR", "reason": "<one short sentence>"}}
Use UNCLEAR when the page does not clearly confirm or deny the claim."""
            result = gl.nondet.exec_prompt(task, response_format="json")
            verdict = str(result.get("verdict", "UNCLEAR")).upper()
            if verdict not in VERDICTS:
                verdict = "UNCLEAR"
            reason = str(result.get("reason", ""))[:200]
            return json.dumps({"verdict": verdict, "reason": reason}, sort_keys=True)

        raw = gl.eq_principle.prompt_comparative(
            judge,
            "The `verdict` field must be exactly the same. The `reason` may differ in wording.",
        )
        data = json.loads(raw)
        idx = self.count
        self.checks[idx] = Check(
            claim=claim,
            url=url,
            verdict=data["verdict"],
            reason=data["reason"],
            submitter=gl.message.sender_address,
        )
        self.count = u256(int(idx) + 1)

    @gl.public.view
    def get_count(self) -> int:
        return int(self.count)

    @gl.public.view
    def get_check(self, index: int) -> dict:
        c = self.checks[u256(index)]
        return {
            "claim": c.claim,
            "url": c.url,
            "verdict": c.verdict,
            "reason": c.reason,
            "submitter": c.submitter.as_hex,
        }











































































