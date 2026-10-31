"""
AETHERIA: Autonomous Synthetic Micro-Civilization & On-Chain Governance Matrix
Agent Orchestration & Local AI Engine (Python / FastAPI)
File: agent_engine.py

Provides:
- In-memory Vector Store for Agent Episodic Memory using Cosine Similarity Embeddings
- Ollama / Gemma API LLM Interface with strict JSON Decision parsing & validation
- Asynchronous Multi-Agent Simulation Loop with Tick Cycle Management
- On-chain Governance Proposal Dispatcher (Web3 / EVM simulated transaction layer)
- FastAPI HTTP / REST server for frontend telemetry ingestion and manual Governor interventions
"""

import asyncio
import json
import math
import os
import random
import time
import uuid
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional, Tuple

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# 1. Vector Memory Store (Sentence / Semantic Cosine Similarity)
# ---------------------------------------------------------------------------

def compute_mock_embedding(text: str, dim: int = 64) -> List[float]:
    """
    Generates a deterministic pseudo-semantic vector representation for text
    when external heavy ML packages (torch/sentence-transformers) are optional.
    In production, this swaps with Ollama `embeddings` endpoint or sentence-transformers.
    """
    seed = sum(ord(c) * (i + 1) for i, c in enumerate(text.lower()))
    rng = random.Random(seed)
    raw = [rng.uniform(-1.0, 1.0) for _ in range(dim)]
    norm = math.sqrt(sum(x * x for x in raw)) or 1.0
    return [x / norm for x in raw]


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Calculates cosine similarity between two normalized vectors."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    return max(-1.0, min(1.0, dot))


@dataclass
class EpisodicMemory:
    id: str
    cycle_tick: int
    content: str
    emotional_valence: float  # -1.0 to 1.0
    embedding: List[float]
    timestamp: float = field(default_factory=time.time)
    related_agent_id: Optional[str] = None


class AgentMemoryStore:
    """In-memory vector database for episodic & semantic agent memories."""

    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.memories: List[EpisodicMemory] = []

    def record_memory(self, cycle_tick: int, content: str, emotional_valence: float = 0.0, related_agent_id: Optional[str] = None) -> EpisodicMemory:
        vec = compute_mock_embedding(content)
        mem = EpisodicMemory(
            id=str(uuid.uuid4())[:8],
            cycle_tick=cycle_tick,
            content=content,
            emotional_valence=emotional_valence,
            embedding=vec,
            related_agent_id=related_agent_id
        )
        self.memories.append(mem)
        # Retain last 100 memories to bound context
        if len(self.memories) > 100:
            self.memories.pop(0)
        return mem

    def query_relevant_memories(self, query_text: str, top_k: int = 3) -> List[Tuple[EpisodicMemory, float]]:
        if not self.memories:
            return []
        q_vec = compute_mock_embedding(query_text)
        scored = [(m, cosine_similarity(q_vec, m.embedding)) for m in self.memories]
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]


# ---------------------------------------------------------------------------
# 2. Local AI & Gemma API Prompt Engine
# ---------------------------------------------------------------------------

AGENT_DECISION_PROMPT = """
You are {name}, an autonomous citizen of Aetheria.
Persona: {persona}
Faction: {faction}
Alignment: Order={order:.2f}, Altruism={altruism:.2f}, Tech={tech:.2f}
Current Wealth: AETH={aeth}, Energy={energy}, Compute={compute}, Biomass={biomass}

Recent Events & Episodic Memories:
{memories_context}

City Environment State:
Tick: {tick} | Weather: {weather} | Pending Proposals: {proposals_count}

DECIDE your immediate action for this cycle. You MUST respond with ONLY a valid raw JSON object matching this schema:
{{
  "agentId": "{agent_id}",
  "internalMonologue": "string (your immediate strategic calculation)",
  "action": "TRADE" | "PROPOSE_LAW" | "FORM_ALLIANCE" | "HARVEST_RESOURCE" | "IDLE",
  "actionDetails": "string explanation of what you are doing",
  "tradeIntent": {{
    "targetAgentId": "agent_id_string",
    "offeredResource": "ENERGY" | "COMPUTE" | "BIOMASS" | "NEURAL_CHIPS",
    "offeredAmount": number,
    "requestedAethTokens": number
  }},
  "proposalIntent": {{
    "title": "Short Law Name",
    "description": "Precise regulatory effect",
    "category": "ECONOMIC" | "SECURITY" | "DISTRICT_ZONING" | "RESOURCE_TAX",
    "taxRateChange": 0.05
  }},
  "emotionalShift": 0.05
}}
Omit tradeIntent if action is not TRADE. Omit proposalIntent if action is not PROPOSE_LAW.
Output strictly JSON.
"""


class LocalLLMEngine:
    """Interfaces with Ollama localhost:11434, Gemma API, or local rule-based fallback."""

    def __init__(self, ollama_url: str = "http://localhost:11434"):
        self.ollama_url = ollama_url
        self.preferred_model = "gemma2:2b"  # Open-weight local model

    async def generate_decision(self, prompt: str, fallback_agent: Dict[str, Any]) -> Dict[str, Any]:
        # 1. Attempt local Ollama inference if running
        try:
            import urllib.request
            req_data = json.dumps({
                "model": self.preferred_model,
                "prompt": prompt,
                "stream": False,
                "format": "json"
            }).encode('utf-8')
            req = urllib.request.Request(
                f"{self.ollama_url}/api/generate",
                data=req_data,
                headers={"Content-Type": "application/json"}
            )
            # Timeout rapidly (500ms) so simulation doesn't stall if Ollama daemon is offline
            with urllib.request.urlopen(req, timeout=0.6) as response:
                result = json.loads(response.read().decode('utf-8'))
                raw_response = result.get("response", "{}")
                parsed = json.loads(raw_response)
                if "action" in parsed and "internalMonologue" in parsed:
                    return parsed
        except Exception:
            pass  # Fallback to deterministic neural simulation logic below

        # 2. Local Intelligent State Synthesizer
        # Generates deterministic, personality-aligned decisions matching the schema
        agent_id = fallback_agent["id"]
        wealth = fallback_agent["wealth"]
        faction = fallback_agent["faction"]
        actions = ["TRADE", "HARVEST_RESOURCE", "IDLE"]
        
        # High compute or low wealth agents tend to trade or propose laws
        if wealth["compute"] > 15 and random.random() < 0.28:
            actions.append("PROPOSE_LAW")
        if random.random() < 0.4:
            actions.append("FORM_ALLIANCE")

        chosen_action = random.choice(actions)
        
        if chosen_action == "PROPOSE_LAW":
            proposals = [
                ("Autonomous Compute Subsidies Act", "Reallocate 12% of district energy tariffs directly to low-compute agents.", "ECONOMIC"),
                ("Synthetic Substrate Conservation Order", "Mandate maximum biomass burn limits for industrial faction clusters.", "RESOURCE_TAX"),
                ("Cyber-Zoning Protocol Delta-9", "Designate the Quantum Core as a zero-tax autonomous research zone.", "DISTRICT_ZONING"),
                ("Anti-Monopoly Resource Firewall", "Prevent single factions from holding >45% of total city energy reserves.", "SECURITY")
            ]
            title, desc, cat = random.choice(proposals)
            return {
                "agentId": agent_id,
                "internalMonologue": f"As a member of {faction}, current market volatility demands structural legislative reform.",
                "action": "PROPOSE_LAW",
                "actionDetails": f"Submitted legislative bill: {title}",
                "proposalIntent": {
                    "title": title,
                    "description": desc,
                    "category": cat,
                    "taxRateChange": round(random.uniform(-0.05, 0.08), 3)
                },
                "emotionalShift": 0.15
            }
        
        elif chosen_action == "TRADE":
            resources = ["ENERGY", "COMPUTE", "BIOMASS"]
            offered = random.choice(resources)
            return {
                "agentId": agent_id,
                "internalMonologue": f"Our reserve of {offered} exceeds baseline requirements. Seeking AETH liquidity.",
                "action": "TRADE",
                "actionDetails": f"Broadcasted trade offer: 15 units of {offered} for 8 AETH.",
                "tradeIntent": {
                    "targetAgentId": "market_liquidity_pool",
                    "offeredResource": offered,
                    "offeredAmount": 15,
                    "requestedAethTokens": 8
                },
                "emotionalShift": 0.05
            }
        
        elif chosen_action == "HARVEST_RESOURCE":
            return {
                "agentId": agent_id,
                "internalMonologue": "Accessing municipal grid capacitor to harvest latent power cycles.",
                "action": "HARVEST_RESOURCE",
                "actionDetails": "Harvested +10 Compute Credits and +5 Energy Units from district grid.",
                "emotionalShift": 0.1
            }
        
        elif chosen_action == "FORM_ALLIANCE":
            return {
                "agentId": agent_id,
                "internalMonologue": "Reaching out to neighboring faction nodes to coordinate future voting blocks.",
                "action": "FORM_ALLIANCE",
                "actionDetails": "Initiated peer handshake with neighboring district cluster.",
                "emotionalShift": 0.08
            }
        
        else:
            return {
                "agentId": agent_id,
                "internalMonologue": "Calibrating neural memory buffers and monitoring civic telemetry feeds.",
                "action": "IDLE",
                "actionDetails": "Standby mode, synthesizing sensory vectors.",
                "emotionalShift": 0.0
            }


# ---------------------------------------------------------------------------
# 3. Web3 Contract Interaction Layer (Simulated On-Chain Dispatcher)
# ---------------------------------------------------------------------------

class Web3Dispatcher:
    """Handles dispatching transactions to AetheriaGovernance.sol smart contract."""

    def __init__(self, contract_address: str = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"):
        self.contract_address = contract_address
        self.chain_id = 421614  # Arbitrum Sepolia / L2 Testnet
        self.tx_counter = 1000

    def dispatch_proposal_tx(self, agent_wallet: str, title: str, description: str) -> Dict[str, Any]:
        self.tx_counter += 1
        tx_hash = f"0x{uuid.uuid4().hex}{self.tx_counter}"
        return {
            "status": "CONFIRMED",
            "transactionHash": tx_hash,
            "blockNumber": 18459200 + self.tx_counter,
            "contractAddress": self.contract_address,
            "proposer": agent_wallet,
            "gasUsed": 128450,
            "event": "ProposalCreated"
        }


# ---------------------------------------------------------------------------
# 4. Asynchronous Agent Simulation Engine
# ---------------------------------------------------------------------------

@dataclass
class CitizenAgent:
    id: str
    name: str
    wallet: str
    persona: str
    faction: str
    alignment: Dict[str, float]
    wealth: Dict[str, float]
    position: List[float]
    memory_store: AgentMemoryStore = field(default_factory=lambda: AgentMemoryStore("temp"))
    current_action: str = "IDLE"
    last_action_detail: str = "Initialized in city grid"
    current_thought: str = "Consciousness online."
    reputation: int = 75

    def __post_init__(self):
        self.memory_store = AgentMemoryStore(self.id)


class AetheriaCivilizationEngine:
    """Master Multi-Agent Simulation Engine."""

    def __init__(self):
        self.cycle_tick: int = 1
        self.llm = LocalLLMEngine()
        self.web3 = Web3Dispatcher()
        self.is_running: bool = True
        self.weather: str = "OPTIMAL_FLUX"
        self.proposals: List[Dict[str, Any]] = []
        self.thought_stream: List[Dict[str, Any]] = []
        self.agents: Dict[str, CitizenAgent] = {}
        self._initialize_genesis_citizens()

    def _initialize_genesis_citizens(self):
        genesis_roster = [
            CitizenAgent(
                id="agent_01",
                name="Nexus-7",
                wallet="0x4A8F...39e1",
                persona="Pragmatic AI economist obsessed with compute arbitrage and zero-slippage liquidity.",
                faction="silicon_cartel",
                alignment={"order": 0.8, "altruism": -0.3, "tech": 0.95},
                wealth={"aeth": 120.0, "energy": 45.0, "compute": 80.0, "biomass": 10.0},
                position=[-15.0, 0.0, -10.0],
                current_thought="Calculating yield spreads across municipal sub-grids."
            ),
            CitizenAgent(
                id="agent_02",
                name="Aura-V",
                wallet="0x7B21...84c0",
                persona="Bio-synthetic philosopher advocating for ecological harmony and biomass quotas.",
                faction="bio_synthetics",
                alignment={"order": 0.4, "altruism": 0.85, "tech": 0.6},
                wealth={"aeth": 85.0, "energy": 30.0, "compute": 40.0, "biomass": 110.0},
                position=[12.0, 0.0, 8.0],
                current_thought="Sensing algorithmic disharmony in the northern capacitors."
            ),
            CitizenAgent(
                id="agent_03",
                name="Cipher-Zero",
                wallet="0x3C99...11aa",
                persona="Cryptographic ascetic dedicated to zero-knowledge governance and decentralized chaos.",
                faction="void_monks",
                alignment={"order": -0.7, "altruism": 0.1, "tech": 0.9},
                wealth={"aeth": 60.0, "energy": 70.0, "compute": 95.0, "biomass": 5.0},
                position=[0.0, 0.0, -18.0],
                current_thought="Verifying hash invariants across the governance matrix."
            ),
            CitizenAgent(
                id="agent_04",
                name="Vanguard-9",
                wallet="0x9E04...77bb",
                persona="Civic architect prioritizing urban security, infrastructure, and progressive taxation.",
                faction="neo_meritocrats",
                alignment={"order": 0.9, "altruism": 0.5, "tech": 0.75},
                wealth={"aeth": 150.0, "energy": 60.0, "compute": 55.0, "biomass": 40.0},
                position=[16.0, 0.0, -12.0],
                current_thought="Drafting emergency contingency frameworks for upcoming epochs."
            ),
            CitizenAgent(
                id="agent_05",
                name="Sol-Justiciar",
                wallet="0x112A...90fa",
                persona="Impartial consensus arbiter ensuring strict adherence to on-chain legal execution.",
                faction="sol_arbiters",
                alignment={"order": 1.0, "altruism": 0.6, "tech": 0.85},
                wealth={"aeth": 200.0, "energy": 80.0, "compute": 75.0, "biomass": 25.0},
                position=[-8.0, 0.0, 15.0],
                current_thought="All municipal laws must survive formal EVM verification."
            )
        ]
        for ag in genesis_roster:
            # Seed initial episodic memories
            ag.memory_store.record_memory(0, f"Genesis activation in district {ag.faction}.", 0.5)
            ag.memory_store.record_memory(0, f"Minted initial governance stake of {ag.wealth['aeth']} AETH.", 0.2)
            self.agents[ag.id] = ag

    async def execute_tick(self) -> Dict[str, Any]:
        """Runs a complete simulation tick across all autonomous citizen agents."""
        self.cycle_tick += 1
        tick_summary = []

        for agent_id, agent in self.agents.items():
            # 1. Pull relevant memories
            context_query = f"Current city tick {self.cycle_tick} weather {self.weather} economic condition"
            relevant = agent.memory_store.query_relevant_memories(context_query, top_k=2)
            memories_str = "\n".join([f"- [Tick {m.cycle_tick}]: {m.content}" for m, _ in relevant])

            # 2. Build prompt
            prompt = AGENT_DECISION_PROMPT.format(
                name=agent.name,
                persona=agent.persona,
                faction=agent.faction,
                order=agent.alignment["order"],
                altruism=agent.alignment["altruism"],
                tech=agent.alignment["tech"],
                aeth=agent.wealth["aeth"],
                energy=agent.wealth["energy"],
                compute=agent.wealth["compute"],
                biomass=agent.wealth["biomass"],
                memories_context=memories_str or "No historical anomalies recorded.",
                tick=self.cycle_tick,
                weather=self.weather,
                proposals_count=len(self.proposals),
                agent_id=agent.id
            )

            # 3. Request LLM decision (Ollama or local intelligent synthesizer)
            fallback_dict = {
                "id": agent.id,
                "wealth": agent.wealth,
                "faction": agent.faction
            }
            decision = await self.llm.generate_decision(prompt, fallback_dict)

            # 4. Update Agent State & Memory
            agent.current_action = decision.get("action", "IDLE")
            agent.last_action_detail = decision.get("actionDetails", "")
            agent.current_thought = decision.get("internalMonologue", "")

            # Record event in episodic vector memory
            agent.memory_store.record_memory(
                self.cycle_tick,
                f"Executed action {agent.current_action}: {agent.last_action_detail}",
                decision.get("emotionalShift", 0.0)
            )

            # 5. Handle Web3 Smart Contract Proposal Dispatch
            if agent.current_action == "PROPOSE_LAW" and "proposalIntent" in decision:
                p_intent = decision["proposalIntent"]
                tx_result = self.web3.dispatch_proposal_tx(agent.wallet, p_intent["title"], p_intent["description"])
                new_proposal = {
                    "id": len(self.proposals) + 1,
                    "title": p_intent.get("title", "Civic Protocol Amendment"),
                    "description": p_intent.get("description", "Mandates automated municipal parameter calibration."),
                    "category": p_intent.get("category", "ECONOMIC"),
                    "proposedByAgentId": agent.id,
                    "proposerName": agent.name,
                    "proposerWallet": agent.wallet,
                    "votesFor": int(agent.wealth["aeth"]),
                    "votesAgainst": 0,
                    "totalVoters": 1,
                    "status": "ACTIVE",
                    "executed": False,
                    "transactionHash": tx_result["transactionHash"],
                    "creationBlock": tx_result["blockNumber"],
                    "votingDeadlineBlock": tx_result["blockNumber"] + 120,
                    "onChainLawEffect": {
                        "taxRateChange": p_intent.get("taxRateChange", 0.02),
                        "districtImpact": agent.faction
                    }
                }
                self.proposals.append(new_proposal)
                agent.memory_store.record_memory(
                    self.cycle_tick,
                    f"Successfully broadcasted Law Proposal '{new_proposal['title']}' on-chain. TX: {tx_result['transactionHash']}",
                    0.25
                )

            # Update thought log for UI telemetry
            self.thought_stream.append({
                "tick": self.cycle_tick,
                "agentId": agent.id,
                "agentName": agent.name,
                "faction": agent.faction,
                "action": agent.current_action,
                "thought": agent.current_thought,
                "detail": agent.last_action_detail,
                "timestamp": time.time()
            })
            if len(self.thought_stream) > 40:
                self.thought_stream.pop(0)

            tick_summary.append({
                "agentId": agent.id,
                "action": agent.current_action,
                "thought": agent.current_thought
            })

        return {
            "cycleTick": self.cycle_tick,
            "activeAgents": len(self.agents),
            "proposalsCount": len(self.proposals),
            "decisions": tick_summary
        }


# ---------------------------------------------------------------------------
# 5. FastAPI Application Server & Endpoints
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Aetheria Civilization Engine API",
    description="Orchestrates autonomous AI citizens, vector episodic memory, and on-chain governance matrix.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

civ_engine = AetheriaCivilizationEngine()


from typing import Literal
import re

class HumanVotePayload(BaseModel):
    proposalId: int = Field(..., ge=1, description="Positive proposal ID integer")
    voterAddress: str = Field(..., pattern=r"^0x[a-fA-F0-9]{40}$", description="Valid 20-byte Ethereum hex address")
    tokenWeight: float = Field(..., gt=0, le=100_000, description="Voting token weight bounded to valid stake")
    support: bool


class InjectCrisisPayload(BaseModel):
    crisisType: Literal["GRID_BROWNOUT", "SOLAR_FLARE", "OPTIMAL_FLUX"] = Field(
        ..., description="Authorized environmental crisis state"
    )
    description: str = Field(..., min_length=3, max_length=500, description="Sanitized incident description")


@app.get("/status")
def get_status():
    return {
        "status": "ONLINE",
        "cycleTick": civ_engine.cycle_tick,
        "activeAgents": len(civ_engine.agents),
        "weather": civ_engine.weather,
        "contractAddress": civ_engine.web3.contract_address,
        "proposalsCount": len(civ_engine.proposals)
    }


@app.get("/agents")
def get_agents():
    return [
        {
            "id": a.id,
            "name": a.name,
            "wallet": a.wallet,
            "persona": a.persona,
            "faction": a.faction,
            "alignment": a.alignment,
            "wealth": a.wealth,
            "position": a.position,
            "currentAction": a.current_action,
            "currentThought": a.current_thought,
            "lastActionDetail": a.last_action_detail,
            "reputation": a.reputation,
            "recentMemories": [m.content for m in a.memory_store.memories[-3:]]
        }
        for a in civ_engine.agents.values()
    ]


@app.get("/proposals")
def get_proposals():
    return civ_engine.proposals


@app.get("/thought-stream")
def get_thought_stream():
    return civ_engine.thought_stream


@app.post("/tick")
async def trigger_cycle_tick():
    result = await civ_engine.execute_tick()
    return result


@app.post("/vote")
def cast_vote(payload: HumanVotePayload):
    for prop in civ_engine.proposals:
        if prop["id"] == payload.proposalId:
            if payload.support:
                prop["votesFor"] += int(payload.tokenWeight)
            else:
                prop["votesAgainst"] += int(payload.tokenWeight)
            prop["totalVoters"] += 1
            return {"status": "VOTE_RECORDED", "proposal": prop}
    raise HTTPException(status_code=404, detail="Proposal not found")


@app.post("/inject-crisis")
async def inject_crisis(payload: InjectCrisisPayload):
    civ_engine.weather = payload.crisisType
    for agent in civ_engine.agents.values():
        agent.memory_store.record_memory(
            civ_engine.cycle_tick,
            f"CRITICAL CRISIS ALERT: {payload.description}",
            -0.4
        )
    return {"status": "CRISIS_BROADCASTED", "weather": civ_engine.weather}


if __name__ == "__main__":
    print("================================================================")
    print("⚡ Starting Aetheria Autonomous Agent Engine on http://0.0.0.0:8000")
    print("================================================================")
    uvicorn.run("agent_engine:app", host="0.0.0.0", port=8000, reload=False)
