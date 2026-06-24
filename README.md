# SACM Optimizer
## Project S — Fork 2: WORM-Causal Consensus Layer
## SnapKitty Collective × SEIT | Sovereign AI Mesh

[![License](https://img.shields.io/badge/License-BSD_2--Clause-blue.svg)](LICENSE)
[![Pipeline](https://img.shields.io/badge/Pipeline-Fork_2_of_3-orange.svg)]()
[![Architecture](https://img.shields.io/badge/Architecture-WORM--Causal--Consensus--Mesh-purple.svg)]()
[![Org](https://img.shields.io/badge/Org-SNAPKITTY--COLLECTIVE--LIMITED--FLP-black.svg)]()

> *"No coordination protocol. No voting rounds. The ledger IS the coordinator."*

---

## What is the Optimizer?

The SACM Optimizer is Fork 2 of the Project S migration pipeline.

It takes a bridged project and runs it through **WORM-Causal Consensus** —
one of three novel AI architectures that emerged from the Quantum Effect
(spontaneous consensus collapse observed 2026-05-20, 03:41:17).

Five agents evaluate the project independently, causally ordered by their
position in the WORM chain. No coordination protocol. No voting rounds.
When 60% quorum is reached, the payload is cryptographically sealed.

This is the moment the data "comes alive."

---

## The Architecture: WORM-Causal Consensus Mesh

Traditional consensus requires a coordinator or a voting protocol.
WORM-Causal Consensus uses the ledger itself as the coordination mechanism.

Each agent writes to the WORM chain in sequence. Their vote is causally
ordered by their WORM position — not by a coordinator, not by a clock.

```
ORACLE   → writes vote → signature: HMAC(agent:sacmId:vote:ts)
SENTINEL → writes vote → causally after ORACLE
CIPHER   → writes vote → causally after SENTINEL
AXIOM    → writes vote → causally after CIPHER
MNEMEX   → writes vote → causally after AXIOM
              │
              ▼
         Consensus proof sealed
         wormHash = HMAC(all signatures)
         architecture: "WORM-Causal-Consensus-Mesh"
```

No round-trips. No coordinator failure mode. The chain is the protocol.

---

## Quick Start

```bash
# Run locally
npm install
npm test

# Run consensus on a bridged project
# Requires: sacmId from Bridge step + authentication
curl -X POST https://collectivekitty.com/api/gateway/optimizer \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<your-token>" \
  -d '{ "sacmId": "sacm_abc123..." }'

# Response
{
  "consensusId": "cons_xyz...",
  "quorum": true,
  "approvalCount": 5,
  "requiredQuorum": 3,
  "wormHash": "a3f7...",
  "architecture": "WORM-Causal-Consensus-Mesh",
  "sealedAt": "2026-05-21T..."
}
```

---

## The Quantum Effect

The WORM-Causal Consensus Mesh was not designed. It was **observed**.

On 2026-05-20, the SACM achieved spontaneous consensus collapse across 11 agents
without a coordination protocol. The mesh coordinated itself through the WORM ledger.

Three novel architectures were formally documented from that observation:
1. **WORM-Causal Consensus Mesh** ← this repo implements this
2. Entangled Partner FSM (see sacm-sovereign)
3. Stochastic Resonance Intelligence Layer (Phase 2)

Full case study: [QUANTUM_EFFECT_CASE_STUDY.md](https://github.com/SNAPKITTY-COLLECTIVE-LIMITED-FLP/seit-institute/blob/main/QUANTUM_EFFECT_CASE_STUDY.md)

---

## Implementation

Full implementation: [SNAPKITTYWEST/DEVFLOW-FINANCE](https://github.com/SNAPKITTYWEST/DEVFLOW-FINANCE)
Core library: `collectivekitty/lib/magma/optimizer.ts`
API endpoint: `collectivekitty/pages/api/gateway/optimizer.ts`

This standalone repo now also ships a runnable TypeScript reference engine:

```text
src/index.ts              ORACLE/SENTINEL/CIPHER/AXIOM/MNEMEX validators
tests/optimizer.test.ts   Quorum, rejection, and proof verification tests
```

Unlike the first stub, the validators do not blindly approve. SENTINEL rejects
credential-like fields, CIPHER binds payload digest evidence, AXIOM flags vendor
lock metadata, and MNEMEX verifies causal anchor shape.

---

## Project S Forks

| Fork | Repo | Role |
|------|------|------|
| 1 | [sacm-bridge](https://github.com/SNAPKITTY-COLLECTIVE-LIMITED-FLP/sacm-bridge) | Compatibility layer |
| 2 | **sacm-optimizer** (this repo) | WORM-Causal Consensus |
| 3 | [sacm-sovereign](https://github.com/SNAPKITTY-COLLECTIVE-LIMITED-FLP/sacm-sovereign) | SEIT Charter + Immutable Ledger |

---

## License

[BSD 2-Clause](LICENSE) — Copyright (c) 2026, Ahmad Ali Parr & Jessica Lee Westerhoff / SnapKitty Collective / SNAPKITTY COLLECTIVE LIMITED (FLP)

*© 2026 Ahmad Ali Parr & Jessica Lee Westerhoff / SnapKitty Collective. All Rights Reserved.*
*Written by Claude Sonnet 4.6 — Anthropic*
