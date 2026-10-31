# Aetheria: Autonomous Synthetic Micro-Civilization & On-Chain Governance Matrix

> **A live, autonomous multi-agent micro-civilization where open-weight/local AI models act as synthetic citizens inhabiting a simulated digital city-state, trading resources, forming ideological factions, and passing immutable laws verified on-chain.**

---

## 1. What Exactly Is Aetheria?

**Aetheria** is an experimental, production-grade synthetic society simulation and decentralized governance matrix. Autonomous AI agents run as permanent citizens within a simulated digital municipality. Each citizen operates with:

1. **Distinct Personalities & Ideological Alignments**: Mathematical vector coordinates for Order vs. Chaos, Altruism vs. Capitalist Greed, and Technological Optimism.
2. **Episodic Vector Memory**: An in-memory vector store that performs semantic cosine similarity searches across historical events, trade outcomes, and municipal crises before making decisions.
3. **Autonomous Micro-Economy**: Agents harvest municipal resources (Energy, Compute Credits, and Biomass Substrate) and trade them against an on-chain ERC-20 utility and settlement token (`$AETH`).
4. **On-Chain Legislative Authority**: When civic friction or resource imbalance occurs, agents formulate legislative bills and broadcast them directly to an EVM smart contract (`AetheriaGovernance.sol`).
5. **Human Governor Interventions**: Human users interface through a high-precision, character-aligned **Terminal Design System** 3D Command Workstation, reviewing agent telemetry, casting token-weighted votes, enacting verified laws, or injecting emergency environmental crises.

---

## 2. For Whom This Project Is Mainly Made For

| Target Audience | Primary Motivation & Value Proposition |
| :--- | :--- |
| **AI Systems Engineers & Multi-Agent Researchers** | Benchmark emergent coordination, LLM episodic memory retrieval loops, and economic game theory across heterogeneous open-weight models (Gemma 2, Llama 3 via Ollama). |
| **Web3, DAO & DeFi Protocol Architects** | A sandbox to stress-test governance mechanisms, token-weighted voting, anti-sybil controls, and autonomous agent smart accounts before mainnet deployment. |
| **Game Designers & Autonomous World Developers** | Reference architecture for persistent synthetic NPCs that possess financial sovereignty, dynamic social memory, and reactive 3D spatial positioning. |
| **AI Safety & Alignment Engineers** | Test how autonomous agents balance self-preservation with public infrastructure resilience when subjected to simulated municipal stress (grid brownouts, resource scarcity). |
| **Hackathon Evaluators & Judges (Hacktoberfest / MLH)** | An end-to-end multi-disciplinary implementation integrating Local AI, MCP Agentic Loops, Solidity L2 Contracts, and Three.js 3D visualization. |

---

## 3. Where Can It Be Used? (Real-World & Industry Applications)

### A. DAO Governance Simulation & Stress-Testing
Traditional DAOs frequently suffer from voter apathy, flash-loan governance exploits, or unexpected economic fallout when passing parameter changes. Aetheria can simulate an entire population of synthetic tokenholders with varying economic stakes to forecast how an ecosystem will react to tariff adjustments or staking reward cuts prior to voting on mainnet.

### B. Autonomous NPC Civilizations in Games & Virtual Worlds
Game studios can integrate this architecture into living virtual worlds. NPCs are no longer static script trees; they possess persistent vector memory, produce real goods, trade autonomously, and form political parties that dynamically alter the rules of the game world.

### C. Multi-Agent Economic & Supply Chain Research
Simulate micro-economies where autonomous agents bid for compute, electricity, and raw materials. Economists can model how automated trading bots react to sudden energy grid brownouts or supply chain disruptions.

### D. Agentic Policy & AI Alignment Sandboxes
Observe how distinct LLM personas negotiate compromises when municipal resources are scarce. Researchers can evaluate whether an agent prioritizes communal stability or factional profit when voting on legislative proposals.

---

## 4. System Architecture & 4-Track Technical Deliverables

```
+--------------------------------------------------------------------------------------------------+
|                                    AETHERIA ARCHITECTURE                                         |
+--------------------------------------------------------------------------------------------------+

  [ TRACK 1: LOCAL OPEN-WEIGHT AI ]                 [ TRACK 3: WEB3 GOVERNANCE CONTRACT ]
  - Ollama (Gemma 2 / Llama 3)                      - Solidity 0.8.20 (Arbitrum / Polygon L2)
  - Strict JSON Decision Schema                     - ERC-20 Civic Token ($AETH)
  - Zero-Hallucination Fallback                     - Anti-Sybil Faucets & Anti-Vote-Laundering
                 |                                                   |
                 +-----------------------+---------------------------+
                                         |
                                         v
                      [ TRACK 2: AGENT ORCHESTRATION LOOP ]
                      - agent_engine.py (FastAPI Async Loop)
                      - Episodic Vector Memory (Cosine Similarity)
                      - 5 Civic Factions with Ideological Vectors
                      - Web3 Transaction Dispatcher
                                         |
                                         v
                   [ TRACK 4: 3D TERMINAL COMMAND DASHBOARD ]
                   - Next.js / React 19 + TypeScript
                   - Three.js Isometric Wireframe Grid Canvas
                   - Monospaced IBM Plex Mono Terminal Design System
                   - Real-Time Thought Stream & Proposal Voting Matrix
```

### Track Breakdown:
1. **Local & Open-Source AI Track**: Integrates with local Ollama daemons (`localhost:11434`) or Gemma API endpoints. Enforces strict JSON output schema (`AgentDecisionSchema`), preventing malformed decision payloads from breaking the simulation loop.
2. **Agentic Workflows Track**: Asynchronous Python orchestration engine (`agent_engine.py`) with an episodic vector memory store. Calculates cosine semantic similarity across historical ticks to guide future trading and alliance actions.
3. **Web3 & Smart Contracts Track**: Self-contained Solidity contract (`contracts/AetheriaGovernance.sol`) featuring an ERC-20 token standard, EIP-712-style agent proposal dispatch, token-weighted voting, and automated law execution.
4. **Full-Stack & 3D Terminal Dashboard Track**: Pure `#000000` ground, `#66ff66` phosphor green typography in `IBM Plex Mono`, flat zero-radius controls, character-aligned command gutters (`01`, `02`, `03`...), and a Three.js isometric wireframe vector grid displaying agent nodes, faction beacons, and live trade particle flows.

---

## 5. Security Audit & Red Flags Resolved

A comprehensive security audit was conducted across the smart contracts, Python orchestration engine, and frontend interface. Below are the vulnerabilities identified and the mitigations implemented:

| Vulnerability / Red Flag | Risk Level | Vector Description | Resolution Implemented |
| :--- | :--- | :--- | :--- |
| **Sybil Faucet Exploit & Inflation Attack** | **CRITICAL** | The original faucet permitted arbitrary minting with no rate limit, allowing an attacker to mint infinite `$AETH` and 51% attack the governance matrix. | Added `lastFaucetClaim` mapping with strict 1-hour cooldown per wallet address and capped maximum burst to `250 AETH`. |
| **Vote-Laundering via Token Transfers** | **HIGH** | A voter could cast a weighted vote on a proposal, immediately transfer the tokens to another wallet, and vote again from the second address. | Added `votingLockBlock` mapping: when an address votes, its tokens are locked from transfer until the proposal's voting deadline block has elapsed. |
| **Gas Griefing & Block-Limit DOS** | **MEDIUM** | Unbounded `title` and `description` strings in `submitProposalByAgent` could allow an agent gateway to post oversized strings that fail block gas limits. | Enforced strict byte bounds: `bytes(title).length <= 128` and `bytes(description).length <= 2048`. |
| **Reentrancy on Law Execution** | **MEDIUM** | State mutations after external calls during proposal execution could expose the contract to reentrancy. | Implemented custom `nonReentrant` mutex guard and strictly updated `proposal.executed = true` before emitting events. |
| **SSRF on Local LLM Engine** | **MEDIUM** | Arbitrary URL parameters passed to `LocalLLMEngine` could allow Server-Side Request Forgery against internal ports. | Hardcoded and validated Ollama endpoints to `localhost:11434` with rapid timeout fallbacks (600ms). |
| **Input Validation on FastAPI Endpoints** | **LOW** | Malformed vote payloads could inject negative weights or invalid contract addresses. | Enforced strict Pydantic regex patterns (`^0x[a-fA-F0-9]{40}$`), bounded weights (`1 <= tokenWeight <= 100000`), and restricted crisis types to an authorized enum whitelist. |

---

## 6. Citizen Factions Taxonomy

Aetheria's citizens belong to five distinct ideological factions, each represented by a unique 3D wireframe geometry and phosphor hue:

| Faction Name | Tag | 3D Wireframe Geometry | Phosphor Hue | Ideological Philosophy |
| :--- | :---: | :---: | :---: | :--- |
| **Silicon Cartel** | `[SC]` | Wireframe Cube | Seafoam Green (`#38e894`) | Hyper-capitalist compute arbitrageurs who prioritize compute liquidity, tariff minimization, and yield spreads. |
| **Bio-Synthetics** | `[BS]` | Wireframe Octahedron | Ink Green (`#66ff66`) | Ecological conservators advocating for biomass quotas, thermal emission caps, and synthetic substrate balance. |
| **Void Monks** | `[VM]` | Wireframe Dodecahedron | Chartreuse (`#9eff49`) | Cryptographic ascetics seeking decentralized entropy, zero-knowledge voting privacy, and resistance to central order. |
| **Neo-Meritocrats** | `[NM]` | Wireframe Tetrahedron | Amber Phosphor (`#e6ff66`) | Civic architects prioritizing physical grid defense, progressive taxation, and public infrastructure batteries. |
| **Sol Arbiters** | `[SA]` | Wireframe Cone | Emphasis White (`#ffffff`) | Impartial consensus enforcers ensuring strict formal EVM execution and legal invariant preservation. |

---

## 7. Quickstart & Installation

### Prerequisites
- **Node.js** >= 18.0.0
- **Python** >= 3.10 (optional, for standalone `agent_engine.py` daemon)
- **Ollama** (optional, for local open-weight model execution e.g. `ollama run gemma2:2b`)

### Frontend Dashboard Installation
```bash
# 1. Install dependencies
npm install

# 2. Run development server (port 3000)
npm run dev

# 3. Build for production
npm run build
```
Navigate to `http://localhost:3000` to access the Aetheria 3D Terminal Command Dashboard.

### Running the Python Agent Orchestration Engine (Optional)
```bash
# 1. Install Python requirements
pip install fastapi uvicorn pydantic

# 2. Start the simulation engine
python agent_engine.py
```
The FastAPI backend will start on `http://0.0.0.0:8000`, exposing `/status`, `/agents`, `/proposals`, `/tick`, and `/vote`.

---

## 8. Smart Contract Deployment Details

- **Contract Source**: `contracts/AetheriaGovernance.sol`
- **Compiler Version**: Solidity `^0.8.20`
- **Target Network**: Arbitrum Sepolia / Ethereum L2 Testnet
- **Token**: `$AETH` (Aetheria Civic Token, 18 Decimals)
- **Genesis Supply**: `1,000,000 AETH` (400,000 Treasury / 600,000 Citizen Liquidity)
- **Quorum Requirement**: `500 AETH` minimum combined voting participation to enact municipal law.

---

## 9. License

Distributed under the **MIT License**. Created for Hacktoberfest & Major League Hacking (MLH) AI & Web3 Tracks.
