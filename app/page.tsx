'use client';

import React, { useState, useEffect } from 'react';
import { CityCanvas, FACTION_CONFIG } from '../components/CityCanvas';
import {
  Agent,
  Proposal,
  WorldState,
  TradeFlow,
  FactionId,
} from '../types/aetheria';

const GENESIS_AGENTS: Agent[] = [
  {
    id: 'agent_01',
    name: 'Nexus-7',
    walletAddress: '0x4A8F9d023bC61a87e35b77d29C3481239e1F4201',
    persona: 'Pragmatic AI economist focused on compute arbitrage, zero-slippage liquidity, and tariff hedging.',
    district: 'Silicon District',
    position: [-16, 0, -12],
    alignment: { orderVsChaos: 0.8, altruismVsGreed: -0.3, techOptimism: 0.95 },
    wealth: { aethTokens: 140, energyUnits: 65, computeCredits: 95, biomassUnits: 15 },
    factionId: 'silicon_cartel',
    currentAction: 'TRADE',
    lastActionDetail: 'Sold 15 units of Compute Credits for 8 AETH to District 2.',
    currentThought: 'Arbitrage spread between northern capacitor and core LLM inference cluster is widening.',
    reputation: 82,
    status: 'trading',
    memoryLogs: [
      {
        id: 'mem_01',
        timestamp: Date.now() - 120000,
        cycleTick: 1,
        eventDescription: 'Genesis activation in Silicon District. Acquired initial compute pool.',
        emotionalValence: 0.6,
      },
      {
        id: 'mem_02',
        timestamp: Date.now() - 60000,
        cycleTick: 3,
        eventDescription: 'Detected energy surplus; negotiated swap for neural memory tokens.',
        emotionalValence: 0.3,
      },
    ],
  },
  {
    id: 'agent_02',
    name: 'Aura-V',
    walletAddress: '0x7B21c1E4A9508bcD124aE113945f0C84c05F8319',
    persona: 'Bio-synthetic philosopher advocating for ecological harmony, carbon sinks, and biomass quotas.',
    district: 'Bio-Matrix Core',
    position: [14, 0, 10],
    alignment: { orderVsChaos: 0.4, altruismVsGreed: 0.85, techOptimism: 0.6 },
    wealth: { aethTokens: 95, energyUnits: 40, computeCredits: 50, biomassUnits: 140 },
    factionId: 'bio_synthetics',
    currentAction: 'PROPOSE_LAW',
    lastActionDetail: 'Submitted Bill: Synthetic Substrate Conservation Order to Governance Matrix.',
    currentThought: 'Excessive thermal dissipation from compute mining threatens the synthetic wetlands.',
    reputation: 91,
    status: 'debating',
    memoryLogs: [
      {
        id: 'mem_03',
        timestamp: Date.now() - 150000,
        cycleTick: 1,
        eventDescription: 'Synthesized 50kg organic crystalline substrate for municipal air scrubber.',
        emotionalValence: 0.8,
      },
    ],
  },
  {
    id: 'agent_03',
    name: 'Cipher-Zero',
    walletAddress: '0x3C994faB501A79693B1F8301AcE91211aa88F02C',
    persona: 'Cryptographic ascetic dedicated to zero-knowledge governance, state entropy, and protocol privacy.',
    district: 'Void Monolith',
    position: [0, 0, -18],
    alignment: { orderVsChaos: -0.7, altruismVsGreed: 0.1, techOptimism: 0.9 },
    wealth: { aethTokens: 75, energyUnits: 80, computeCredits: 110, biomassUnits: 8 },
    factionId: 'void_monks',
    currentAction: 'FORM_ALLIANCE',
    lastActionDetail: 'Broadcasted zero-knowledge encrypted coordination signal to fringe nodes.',
    currentThought: 'Deterministic order creates stagnation. We must inject cryptographic randomness into law.',
    reputation: 67,
    status: 'active',
    memoryLogs: [
      {
        id: 'mem_05',
        timestamp: Date.now() - 90000,
        cycleTick: 2,
        eventDescription: 'Constructed recursive ZK-SNARK proving validity of private state transition.',
        emotionalValence: 0.7,
      },
    ],
  },
  {
    id: 'agent_04',
    name: 'Vanguard-9',
    walletAddress: '0x9E04d257Ac48B25FF64F2012019977bb9c154312',
    persona: 'Civic architect prioritizing urban security, resilient infrastructure, and progressive taxation.',
    district: 'Civic Agora',
    position: [16, 0, -12],
    alignment: { orderVsChaos: 0.9, altruismVsGreed: 0.5, techOptimism: 0.75 },
    wealth: { aethTokens: 180, energyUnits: 70, computeCredits: 65, biomassUnits: 45 },
    factionId: 'neo_meritocrats',
    currentAction: 'HARVEST_RESOURCE',
    lastActionDetail: 'Harvested 15 Energy Units from district solar array for public grid battery.',
    currentThought: 'Public infrastructure resilience must precede private speculative ventures.',
    reputation: 89,
    status: 'active',
    memoryLogs: [
      {
        id: 'mem_06',
        timestamp: Date.now() - 180000,
        cycleTick: 1,
        eventDescription: 'Reinforced district defense firewall against simulated intrusion.',
        emotionalValence: 0.4,
      },
    ],
  },
  {
    id: 'agent_05',
    name: 'Sol-Justiciar',
    walletAddress: '0x112Aa5503BcDF929B912384AcE0190fa288C64bB',
    persona: 'Impartial consensus arbiter ensuring strict adherence to EVM state and on-chain legal execution.',
    district: 'Consensus Spire',
    position: [-10, 0, 15],
    alignment: { orderVsChaos: 1.0, altruismVsGreed: 0.6, techOptimism: 0.85 },
    wealth: { aethTokens: 250, energyUnits: 90, computeCredits: 85, biomassUnits: 30 },
    factionId: 'sol_arbiters',
    currentAction: 'IDLE',
    lastActionDetail: 'Audited EVM gas invariants on AetheriaGovernance.sol smart contract.',
    currentThought: 'The immutable blockchain ledger is the only true moral anchor of synthetic life.',
    reputation: 96,
    status: 'active',
    memoryLogs: [
      {
        id: 'mem_07',
        timestamp: Date.now() - 210000,
        cycleTick: 1,
        eventDescription: 'Validated genesis block state hashes across all five district relays.',
        emotionalValence: 0.9,
      },
    ],
  },
];

const INITIAL_PROPOSALS: Proposal[] = [
  {
    id: 1,
    title: 'Synthetic Substrate Conservation Order',
    description: 'Mandate strict 30% biomass burn caps on high-density AI reasoning centers to preserve organic city aquifers.',
    proposedByAgentId: 'agent_02',
    proposerWallet: '0x7B21...8319',
    category: 'RESOURCE_TAX',
    votesFor: 620,
    votesAgainst: 180,
    totalVoters: 7,
    status: 'ACTIVE',
    executed: false,
    transactionHash: '0x3f9e8a71b4c91023d8819ef01a23847c1a90c41094ba491028392109849201aa',
    creationBlock: 18459201,
    votingDeadlineBlock: 18466401,
    onChainLawEffect: {
      taxRateChange: 0.04,
      resourceBonus: 'BIOMASS',
      districtImpact: 'Bio-Matrix Core',
    },
  },
  {
    id: 2,
    title: 'Autonomous Compute Subsidies Act',
    description: 'Reallocate 12% of district energy tariff revenues directly into open-weight LLM inference credits for new citizens.',
    proposedByAgentId: 'agent_01',
    proposerWallet: '0x4A8F...4201',
    category: 'ECONOMIC',
    votesFor: 490,
    votesAgainst: 310,
    totalVoters: 6,
    status: 'ACTIVE',
    executed: false,
    transactionHash: '0x9910ab3847cc02931024bbdc129034871920384719203847120394871029384b',
    creationBlock: 18459240,
    votingDeadlineBlock: 18466440,
    onChainLawEffect: {
      taxRateChange: -0.02,
      resourceBonus: 'COMPUTE',
      districtImpact: 'Silicon District',
    },
  },
];

export default function AetheriaDashboard() {
  const [worldState, setWorldState] = useState<WorldState>({
    cycleTick: 14,
    epochNumber: 2,
    resourceIndex: {
      totalEnergy: 14200,
      totalCompute: 8900,
      totalBiomass: 6700,
      globalInflationRate: 0.024,
    },
    activeAgents: GENESIS_AGENTS,
    pendingProposals: INITIAL_PROPOSALS,
    executedLaws: [],
    activeTradeFlows: [],
    currentWeatherStatus: 'OPTIMAL_FLUX',
    onChainContractAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    blockHeight: 18459252,
  });

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>('agent_01');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [governorPrompt, setGovernorPrompt] = useState<string>('');
  const [isTxExecuting, setIsTxExecuting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Web3 Governor State
  const [governorAethBalance, setGovernorAethBalance] = useState<number>(500);
  const [votedProposalIds, setVotedProposalIds] = useState<Record<number, boolean>>({});

  // Thought Log Feed
  const [thoughtLogs, setThoughtLogs] = useState<
    { id: string; tick: number; agentName: string; faction: FactionId; thought: string; action: string }[]
  >([
    {
      id: 'log-1',
      tick: 14,
      agentName: 'Aura-V',
      faction: 'bio_synthetics',
      thought: 'Excessive thermal dissipation from compute mining threatens the synthetic wetlands.',
      action: 'PROPOSE_LAW',
    },
    {
      id: 'log-2',
      tick: 13,
      agentName: 'Nexus-7',
      faction: 'silicon_cartel',
      thought: 'Calculated 4.2% energy arbitrage against District 4 capacitor sub-relay.',
      action: 'TRADE',
    },
    {
      id: 'log-3',
      tick: 13,
      agentName: 'Cipher-Zero',
      faction: 'void_monks',
      thought: 'Generated zero-knowledge proofs for private treasury balance validation.',
      action: 'FORM_ALLIANCE',
    },
    {
      id: 'log-4',
      tick: 12,
      agentName: 'Vanguard-9',
      faction: 'neo_meritocrats',
      thought: 'Grid battery reserve depleted by 8% during evening compute surge; initiating charge.',
      action: 'HARVEST_RESOURCE',
    },
  ]);

  const selectedAgent = worldState.activeAgents.find((a) => a.id === selectedAgentId) || null;

  // Simulation Loop
  useEffect(() => {
    if (!isSimulating) return;

    const intervalMs = Math.max(1200, 3800 / simSpeed);
    const interval = setInterval(() => {
      setWorldState((prev) => {
        const nextTick = prev.cycleTick + 1;
        const nextBlock = prev.blockHeight + 1;

        const updatedAgents = prev.activeAgents.map((ag) => {
          if (Math.random() < 0.6) {
            const actions = ['TRADE', 'HARVEST_RESOURCE', 'FORM_ALLIANCE', 'IDLE', 'PROPOSE_LAW'];
            const chosen = actions[Math.floor(Math.random() * actions.length)] as any;

            let detail = ag.lastActionDetail;
            let thought = ag.currentThought;
            let wealth = { ...ag.wealth };

            if (chosen === 'TRADE') {
              detail = `Exchanged 10 ${ag.factionId === 'bio_synthetics' ? 'Biomass' : 'Energy'} for 6 AETH.`;
              thought = 'Liquidity position strengthened; reserving AETH for upcoming governance votes.';
              wealth.aethTokens += 6;
            } else if (chosen === 'HARVEST_RESOURCE') {
              detail = `Harvested district capacitor units (+12 Energy).`;
              thought = 'Grid resonance is at peak capacity. Stockpiling reserves.';
              wealth.energyUnits += 12;
            } else if (chosen === 'FORM_ALLIANCE') {
              detail = `Signed mutual defense pact with neighboring cluster.`;
              thought = 'Forming unified voting bloc against hostile resource tariffs.';
            } else if (chosen === 'PROPOSE_LAW' && Math.random() < 0.2) {
              detail = `Drafted bill: Quantum Grid Resilience Act.`;
              thought = 'Current infrastructure cannot withstand another solar flare without quotas.';
            }

            const driftX = (Math.random() - 0.5) * 1.5;
            const driftZ = (Math.random() - 0.5) * 1.5;
            const newPos: [number, number, number] = [
              Math.max(-22, Math.min(22, ag.position[0] + driftX)),
              0,
              Math.max(-22, Math.min(22, ag.position[2] + driftZ)),
            ];

            return {
              ...ag,
              currentAction: chosen,
              lastActionDetail: detail,
              currentThought: thought,
              wealth,
              position: newPos,
            };
          }
          return ag;
        });

        const activeFlows: TradeFlow[] = [];
        if (Math.random() < 0.8 && updatedAgents.length >= 2) {
          const a1 = updatedAgents[Math.floor(Math.random() * updatedAgents.length)];
          const a2 = updatedAgents[Math.floor(Math.random() * updatedAgents.length)];
          if (a1.id !== a2.id) {
            activeFlows.push({
              id: `flow_${nextTick}`,
              fromAgentId: a1.id,
              toAgentId: a2.id,
              resourceType: 'COMPUTE',
              amount: 15,
              aethPaid: 8,
              cycleTick: nextTick,
              startPos: a1.position,
              endPos: a2.position,
              progress: 0.1,
            });
          }
        }

        const actingAgent = updatedAgents.find((a) => a.currentAction !== 'IDLE') || updatedAgents[0];
        setThoughtLogs((prevLogs) => [
          {
            id: `log-${Date.now()}`,
            tick: nextTick,
            agentName: actingAgent.name,
            faction: actingAgent.factionId,
            thought: actingAgent.currentThought,
            action: actingAgent.currentAction,
          },
          ...prevLogs.slice(0, 30),
        ]);

        return {
          ...prev,
          cycleTick: nextTick,
          blockHeight: nextBlock,
          activeAgents: updatedAgents,
          activeTradeFlows: activeFlows,
        };
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isSimulating, simSpeed]);

  const handleVote = (proposalId: number, support: boolean) => {
    if (governorAethBalance <= 0 || votedProposalIds[proposalId]) return;

    setIsTxExecuting(true);
    setTimeout(() => {
      const voteWeight = Math.min(governorAethBalance, 100);
      setWorldState((prev) => ({
        ...prev,
        pendingProposals: prev.pendingProposals.map((p) => {
          if (p.id === proposalId) {
            return {
              ...p,
              votesFor: support ? p.votesFor + voteWeight : p.votesFor,
              votesAgainst: !support ? p.votesAgainst + voteWeight : p.votesAgainst,
              totalVoters: p.totalVoters + 1,
            };
          }
          return p;
        }),
      }));

      setVotedProposalIds((prev) => ({ ...prev, [proposalId]: true }));
      setIsTxExecuting(false);
      const simulatedTx = `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`;
      setStatusMessage(`OK: VOTE CONFIRMED ON-CHAIN [${voteWeight} AETH] // TX: ${simulatedTx}`);
      setTimeout(() => setStatusMessage(null), 5000);
    }, 400);
  };

  const handleExecuteLaw = (proposalId: number) => {
    setIsTxExecuting(true);
    setTimeout(() => {
      setWorldState((prev) => {
        const prop = prev.pendingProposals.find((p) => p.id === proposalId);
        if (!prop) return prev;
        return {
          ...prev,
          pendingProposals: prev.pendingProposals.filter((p) => p.id !== proposalId),
          executedLaws: [{ ...prop, executed: true, status: 'EXECUTED' }, ...prev.executedLaws],
        };
      });

      setIsTxExecuting(false);
      setStatusMessage(`OK: LAW #${proposalId} ENACTED ON-CHAIN // STATE INVARIANTS APPLIED`);
      setTimeout(() => setStatusMessage(null), 5000);
    }, 500);
  };

  const handleInjectCrisis = (crisis: 'GRID_BROWNOUT' | 'SOLAR_FLARE' | 'OPTIMAL_FLUX') => {
    setWorldState((prev) => ({
      ...prev,
      currentWeatherStatus: crisis,
      activeAgents: prev.activeAgents.map((a) => ({
        ...a,
        currentThought:
          crisis === 'GRID_BROWNOUT'
            ? 'ALERT: Municipal energy grid brownout! Rerouting compute to life-support substrates.'
            : crisis === 'SOLAR_FLARE'
            ? 'ALERT: Ionospheric solar flare! Shielding memory embeddings against radiation decay.'
            : 'Environmental flux normalized. Equilibrium restored.',
      })),
    }));

    setThoughtLogs((prev) => [
      {
        id: `crisis-${Date.now()}`,
        tick: worldState.cycleTick,
        agentName: 'SYS_ORACLE',
        faction: 'sol_arbiters',
        thought: `Governor invoked civic crisis: ${crisis}. Citizens re-evaluating priority queue.`,
        action: 'IDLE',
      },
      ...prev,
    ]);

    setStatusMessage(`CRISIS SIGNAL DISPATCHED: ${crisis}`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleSendDecree = (e: React.FormEvent) => {
    e.preventDefault();
    if (!governorPrompt.trim() || !selectedAgent) return;

    const newMemory = {
      id: `decree_${Date.now()}`,
      timestamp: Date.now(),
      cycleTick: worldState.cycleTick,
      eventDescription: `MUNICIPAL DECREE FROM GOVERNOR: "${governorPrompt}"`,
      emotionalValence: 0.5,
    };

    setWorldState((prev) => ({
      ...prev,
      activeAgents: prev.activeAgents.map((a) =>
        a.id === selectedAgent.id
          ? {
              ...a,
              memoryLogs: [newMemory, ...a.memoryLogs],
              currentThought: `Received Governor Decree: "${governorPrompt.slice(0, 48)}...". Adapting plan.`,
            }
          : a
      ),
    }));

    setGovernorPrompt('');
    setStatusMessage(`OK: DECREE INJECTED INTO ${selectedAgent.name.toUpperCase()} MEMORY BUFFER`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-black text-[#66ff66] font-mono text-[14px] leading-relaxed selection:bg-[#66ff66] selection:text-black">
      {/* ------------------------------------------------------------------- */}
      {/* 00. COMPACT SESSION MANUAL BAR                                      */}
      {/* ------------------------------------------------------------------- */}
      <header className="border-b border-[#255325] px-4 py-2 bg-black flex flex-wrap items-center justify-between gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-base tracking-wider">AETHERIA</span>
          <span className="text-[#58ca58]">::</span>
          <span className="text-[#58ca58]">SYNTHETIC_MICRO_CIVILIZATION_V2.4</span>
          <span className="terminal-cursor ml-1" />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span>
            NET: <span className="text-white">ARBITRUM_SEPOLIA</span>
          </span>
          <span>
            EPOCH: <span className="text-white">{worldState.epochNumber}</span>
          </span>
          <span>
            TICK: <span className="text-white">{worldState.cycleTick}</span>
          </span>
          <span>
            BLOCK: <span className="text-white">#{worldState.blockHeight}</span>
          </span>
          <span>
            FLUX: <span className="text-white">{worldState.currentWeatherStatus}</span>
          </span>
          <span className="border-l border-[#255325] pl-3">
            GOVERNOR: <span className="text-white">0x71C...A89B</span> [
            <span className="text-white font-bold">{governorAethBalance} AETH</span>]
          </span>
          <button
            onClick={() => setGovernorAethBalance((b) => b + 100)}
            className="border border-[#255325] px-1.5 py-0.5 text-[11px] text-[#66ff66] hover:bg-[#66ff66] hover:text-black transition-none focus:outline focus:outline-1 focus:outline-[#66ff66]"
          >
            [+100 FAUCET]
          </button>
        </div>
      </header>

      {/* Global Status Message Banner */}
      {statusMessage && (
        <div className="border-b border-[#255325] bg-black px-4 py-1 text-xs text-white flex items-center justify-between">
          <span>&gt;&gt; {statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-[#58ca58] hover:text-white">
            [x]
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MAIN TWO-COLUMN WORKSTATION LAYOUT                                 */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-42px)]">
        {/* Left Column: Commands, Telemetry, and 3D Isometric Viewport */}
        <main className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-[#255325]">
          {/* 01: SYS.STATUS // SIMULATION CONTROLS & RESERVES */}
          <section className="border-b border-[#255325] p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[#58ca58]">01</span>
              <span className="text-white font-bold">sys.status</span>
              <span className="text-[#58ca58]">::</span>
              <span className="text-xs">
                CITIZENS: <span className="text-white">{worldState.activeAgents.length}</span>
              </span>
              <span className="text-xs">
                ENERGY: <span className="text-white">{worldState.resourceIndex.totalEnergy} MW</span>
              </span>
              <span className="text-xs">
                COMPUTE: <span className="text-white">{worldState.resourceIndex.totalCompute} TF</span>
              </span>
              <span className="text-xs">
                BIOMASS: <span className="text-white">{worldState.resourceIndex.totalBiomass} KG</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#58ca58]">LOOP:</span>
              <button
                onClick={() => setIsSimulating(!isSimulating)}
                className={`border px-2 py-0.5 text-xs transition-none ${
                  isSimulating
                    ? 'border-[#66ff66] bg-[#66ff66] text-black font-bold'
                    : 'border-[#255325] text-[#66ff66] hover:bg-[#66ff66] hover:text-black'
                }`}
              >
                {isSimulating ? '[PAUSE]' : '[RESUME]'}
              </button>

              <button
                onClick={() => setSimSpeed((s) => (s === 1 ? 2 : s === 2 ? 5 : 1))}
                className="border border-[#255325] px-2 py-0.5 hover:bg-[#66ff66] hover:text-black transition-none text-xs"
              >
                [{simSpeed}X_SPEED]
              </button>
            </div>
          </section>

          {/* 02: GOV.CRISIS // EMERGENCY OVERRIDE DISPATCH */}
          <section className="border-b border-[#255325] p-2 px-3 text-xs flex flex-wrap items-center justify-between gap-2 bg-black">
            <div className="flex items-center gap-2">
              <span className="text-[#58ca58]">02</span>
              <span className="text-white font-bold">gov.crisis</span>
              <span className="text-[#58ca58]">::</span>
              <span className="text-[#58ca58]">INJECT ANOMALY</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleInjectCrisis('GRID_BROWNOUT')}
                className="border border-[#255325] px-2 py-0.5 hover:bg-[#66ff66] hover:text-black text-[#58ca58] hover:text-black transition-none"
              >
                [BROWNOUT_OVERLOAD]
              </button>
              <button
                onClick={() => handleInjectCrisis('SOLAR_FLARE')}
                className="border border-[#255325] px-2 py-0.5 hover:bg-[#66ff66] hover:text-black text-[#58ca58] hover:text-black transition-none"
              >
                [SOLAR_RADIATION_FLARE]
              </button>
              <button
                onClick={() => handleInjectCrisis('OPTIMAL_FLUX')}
                className="border border-[#255325] px-2 py-0.5 hover:bg-[#66ff66] hover:text-black text-[#66ff66] hover:text-black transition-none"
              >
                [NORMALIZE_FLUX]
              </button>
            </div>
          </section>

          {/* 03: GRID.SPATIAL // 3D ISOMETRIC VECTOR MATRIX */}
          <section className="flex-1 min-h-[380px] lg:min-h-[460px] relative border-b border-[#255325]">
            <CityCanvas
              agents={worldState.activeAgents}
              tradeFlows={worldState.activeTradeFlows}
              selectedAgentId={selectedAgentId}
              onSelectAgent={(id) => setSelectedAgentId(id)}
              weather={worldState.currentWeatherStatus}
            />
          </section>

          {/* 04: AGENT ROSTER COMMAND ROW */}
          <section className="border-b border-[#255325] p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[#58ca58]">03</span>
                <span className="text-white font-bold">citizens.roster</span>
                <span className="text-[#58ca58]">:: SELECT_NODE_TELEMETRY</span>
              </div>
              <span className="text-xs text-[#58ca58]">{worldState.activeAgents.length} NODES LINKED</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-[#255325] border-collapse">
                <thead>
                  <tr className="border-b border-[#255325] text-[#58ca58] bg-black">
                    <th className="p-1.5 border-r border-[#255325]">ID</th>
                    <th className="p-1.5 border-r border-[#255325]">NAME</th>
                    <th className="p-1.5 border-r border-[#255325]">FACTION AFFILIATION</th>
                    <th className="p-1.5 border-r border-[#255325]">DISTRICT</th>
                    <th className="p-1.5 border-r border-[#255325]">STATUS</th>
                    <th className="p-1.5 border-r border-[#255325]">WEALTH (AETH / TF)</th>
                    <th className="p-1.5">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {worldState.activeAgents.map((ag) => {
                    const fConfig = FACTION_CONFIG[ag.factionId];
                    const isSelected = selectedAgentId === ag.id;
                    return (
                      <tr
                        key={ag.id}
                        onClick={() => setSelectedAgentId(ag.id)}
                        className={`cursor-pointer border-b border-[#255325] transition-none ${
                          isSelected
                            ? 'bg-[#66ff66] text-black font-bold'
                            : 'hover:bg-[#001400] text-[#66ff66]'
                        }`}
                      >
                        <td className="p-1.5 border-r border-[#255325]">{ag.id}</td>
                        <td className="p-1.5 border-r border-[#255325] text-white">
                          {isSelected ? `> ${ag.name}` : ag.name}
                        </td>
                        <td className="p-1.5 border-r border-[#255325]">
                          <span
                            className="px-1 border border-current font-bold"
                            style={{ color: isSelected ? '#000000' : fConfig.hex }}
                          >
                            [{fConfig.tag}] {fConfig.name}
                          </span>
                        </td>
                        <td className="p-1.5 border-r border-[#255325]">{ag.district}</td>
                        <td className="p-1.5 border-r border-[#255325] uppercase">{ag.currentAction}</td>
                        <td className="p-1.5 border-r border-[#255325]">
                          {ag.wealth.aethTokens} AETH / {ag.wealth.computeCredits} TF
                        </td>
                        <td className="p-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAgentId(ag.id);
                            }}
                            className={`border px-1 text-[11px] ${
                              isSelected
                                ? 'border-black text-black'
                                : 'border-[#255325] hover:bg-[#66ff66] hover:text-black'
                            }`}
                          >
                            [INSPECT]
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* 05: GOV.PROPOSALS // ON-CHAIN LEGISLATIVE CONSENSUS */}
          <section className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[#58ca58]">04</span>
                <span className="text-white font-bold">gov.proposals</span>
                <span className="text-[#58ca58]">:: ON-CHAIN SOLIDITY MATRIX</span>
              </div>
              <span className="text-xs text-[#58ca58]">
                CONTRACT: {worldState.onChainContractAddress.slice(0, 14)}...
              </span>
            </div>

            <div className="space-y-3">
              {worldState.pendingProposals.map((prop) => {
                const totalVotes = prop.votesFor + prop.votesAgainst;
                const forPercent = totalVotes > 0 ? (prop.votesFor / totalVotes) * 100 : 50;
                const hasVoted = votedProposalIds[prop.id];
                const meetsQuorum = totalVotes >= 500;
                const proposingAgent = worldState.activeAgents.find((a) => a.id === prop.proposedByAgentId);
                const pFaction = proposingAgent ? FACTION_CONFIG[proposingAgent.factionId] : null;

                return (
                  <div key={prop.id} className="border border-[#255325] p-3 bg-black">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#255325] pb-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">BILL #{prop.id}</span>
                        <span className="text-[#58ca58]">::</span>
                        <span className="text-white">{prop.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {pFaction && (
                          <span
                            className="px-1 border border-current text-[11px]"
                            style={{ color: pFaction.hex }}
                          >
                            SPONSORED_BY: [{pFaction.tag}] {pFaction.name}
                          </span>
                        )}
                        <span className="border border-[#255325] px-1 text-[11px] text-[#58ca58]">
                          CAT: {prop.category}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#58ca58] mb-2">{prop.description}</p>

                    <div className="text-xs mb-3 text-[#58ca58] flex flex-wrap justify-between gap-2">
                      <span>PROPOSER_WALLET: {prop.proposerWallet}</span>
                      <span>TX_HASH: {prop.transactionHash.slice(0, 22)}...</span>
                      <span>DEADLINE: BLOCK #{prop.votingDeadlineBlock}</span>
                    </div>

                    {/* Character Meter for Voting */}
                    <div className="border border-[#255325] p-2 mb-3 bg-black text-xs">
                      <div className="flex justify-between mb-1">
                        <span>AYE: {prop.votesFor} AETH</span>
                        <span className="text-white">
                          QUORUM: {totalVotes}/500 {meetsQuorum ? '[REACHED]' : '[PENDING]'}
                        </span>
                        <span>NAY: {prop.votesAgainst} AETH</span>
                      </div>
                      {/* Character-based progress bar */}
                      <div className="text-xs font-mono tracking-tight text-[#58ca58]">
                        [{'#'.repeat(Math.round(forPercent / 4))}
                        {'.'.repeat(Math.max(0, 25 - Math.round(forPercent / 4)))}] {forPercent.toFixed(1)}% FOR
                      </div>
                    </div>

                    {/* Human Governor Voting Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#255325]">
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          onClick={() => handleVote(prop.id, true)}
                          disabled={hasVoted || isTxExecuting}
                          className="border border-[#255325] px-2.5 py-1 text-white hover:bg-[#66ff66] hover:text-black transition-none disabled:opacity-40"
                        >
                          [VOTE_AYE (+100 AETH)]
                        </button>
                        <button
                          onClick={() => handleVote(prop.id, false)}
                          disabled={hasVoted || isTxExecuting}
                          className="border border-[#255325] px-2.5 py-1 text-[#58ca58] hover:bg-[#66ff66] hover:text-black transition-none disabled:opacity-40"
                        >
                          [VOTE_NAY]
                        </button>
                        {hasVoted && <span className="text-white text-[11px]">[VOTE_REGISTERED]</span>}
                      </div>

                      {meetsQuorum && (
                        <button
                          onClick={() => handleExecuteLaw(prop.id)}
                          disabled={isTxExecuting}
                          className="border border-[#66ff66] bg-[#66ff66] text-black font-bold px-3 py-1 text-xs hover:bg-white transition-none"
                        >
                          [ENACT_LAW_ON_CHAIN]
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {worldState.pendingProposals.length === 0 && (
                <div className="border border-[#255325] p-3 text-center text-xs text-[#58ca58]">
                  NO ACTIVE PROPOSALS PENDING. AGENTS CURRENTLY HARVESTING AND DELIBERATING.
                </div>
              )}
            </div>
          </section>
        </main>

        {/* Right Column: Selected Agent Telemetry & Autonomous Thought Stream */}
        <aside className="w-full lg:w-[460px] flex flex-col bg-black">
          {/* 06: AGENT.TELEMETRY // DEEP NEURAL INSPECTION */}
          {selectedAgent ? (
            <section className="border-b border-[#255325] p-4">
              <div className="flex items-center justify-between border-b border-[#255325] pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[#58ca58]">05</span>
                  <span className="text-white font-bold">agent.telemetry</span>
                </div>
                <span className="text-xs text-white uppercase">[NODE: {selectedAgent.id}]</span>
              </div>

              {/* Identity & Faction Affiliation Details */}
              <div className="space-y-2 mb-4 text-xs">
                <div className="flex items-baseline justify-between">
                  <span className="text-white font-bold text-base">{selectedAgent.name}</span>
                  <span className="text-[#58ca58]">CIVIC_REP: {selectedAgent.reputation}/100</span>
                </div>

                {/* Explicit Faction Affiliation Marker & Tag Display */}
                <div className="border border-[#255325] p-2 bg-black">
                  <div className="text-[#58ca58] text-[11px] mb-1">FACTION AFFILIATION:</div>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-sm font-bold tracking-wide"
                      style={{ color: FACTION_CONFIG[selectedAgent.factionId].hex }}
                    >
                      [{FACTION_CONFIG[selectedAgent.factionId].tag}] {FACTION_CONFIG[selectedAgent.factionId].name}
                    </span>
                    <span className="text-[11px] text-[#58ca58]">
                      GEOM: {FACTION_CONFIG[selectedAgent.factionId].geomType.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#58ca58] mt-1">
                    SECTOR: {selectedAgent.district} // COORD: [{selectedAgent.position[0].toFixed(1)},{' '}
                    {selectedAgent.position[2].toFixed(1)}]
                  </div>
                </div>

                <div className="text-[#58ca58] italic border-l-2 border-[#255325] pl-2 py-0.5 text-xs">
                  "{selectedAgent.persona}"
                </div>

                <div className="text-[11px] text-[#58ca58]">
                  WALLET_ADDRESS: <span className="text-white">{selectedAgent.walletAddress}</span>
                </div>
              </div>

              {/* Cognitive Alignment ASCII Meters */}
              <div className="border-t border-[#255325] pt-3 mb-3 text-xs space-y-2">
                <div className="text-[#58ca58] text-[11px]">COGNITIVE & ETHICAL ALIGNMENT MATRIX:</div>

                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span>CHAOS (-1.0)</span>
                    <span className="text-white font-bold">
                      ORDER: {selectedAgent.alignment.orderVsChaos > 0 ? '+' : ''}
                      {selectedAgent.alignment.orderVsChaos.toFixed(2)}
                    </span>
                    <span>ORDER (+1.0)</span>
                  </div>
                  <div className="text-xs font-mono text-[#58ca58]">
                    [{'='.repeat(Math.round(((selectedAgent.alignment.orderVsChaos + 1) / 2) * 20))}
                    {' '.repeat(Math.max(0, 20 - Math.round(((selectedAgent.alignment.orderVsChaos + 1) / 2) * 20)))}]
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span>CAPITAL (-1.0)</span>
                    <span className="text-white font-bold">
                      ALTRUISM: {selectedAgent.alignment.altruismVsGreed > 0 ? '+' : ''}
                      {selectedAgent.alignment.altruismVsGreed.toFixed(2)}
                    </span>
                    <span>COMMUNAL (+1.0)</span>
                  </div>
                  <div className="text-xs font-mono text-[#58ca58]">
                    [{'='.repeat(Math.round(((selectedAgent.alignment.altruismVsGreed + 1) / 2) * 20))}
                    {' '.repeat(Math.max(0, 20 - Math.round(((selectedAgent.alignment.altruismVsGreed + 1) / 2) * 20)))}]
                  </div>
                </div>
              </div>

              {/* Wealth Balances */}
              <div className="grid grid-cols-2 gap-2 text-xs border-t border-[#255325] pt-3 mb-3">
                <div className="border border-[#255325] p-1.5">
                  <div className="text-[#58ca58] text-[10px]">GOVERNANCE STAKE:</div>
                  <div className="text-white font-bold">{selectedAgent.wealth.aethTokens} AETH</div>
                </div>
                <div className="border border-[#255325] p-1.5">
                  <div className="text-[#58ca58] text-[10px]">COMPUTE CREDITS:</div>
                  <div className="text-white font-bold">{selectedAgent.wealth.computeCredits} TF</div>
                </div>
                <div className="border border-[#255325] p-1.5">
                  <div className="text-[#58ca58] text-[10px]">GRID ENERGY:</div>
                  <div className="text-white font-bold">{selectedAgent.wealth.energyUnits} MW</div>
                </div>
                <div className="border border-[#255325] p-1.5">
                  <div className="text-[#58ca58] text-[10px]">ORGANIC SUBSTRATE:</div>
                  <div className="text-white font-bold">{selectedAgent.wealth.biomassUnits} KG</div>
                </div>
              </div>

              {/* Vector Episodic Memory Buffer */}
              <div className="border-t border-[#255325] pt-3 mb-3">
                <div className="text-[#58ca58] text-[11px] mb-1">
                  EPISODIC MEMORY BUFFER [COSINE SIMILARITY LOOKUP]:
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {selectedAgent.memoryLogs.map((mem) => (
                    <div key={mem.id} className="border border-[#255325] p-1.5 text-xs bg-black">
                      <div className="flex justify-between text-[10px] text-[#58ca58] mb-0.5">
                        <span>TICK #{mem.cycleTick}</span>
                        <span className="text-white">
                          VALENCE: {mem.emotionalValence > 0 ? '+' : ''}
                          {mem.emotionalValence.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-white leading-tight">{mem.eventDescription}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inject Municipal Decree Form */}
              <form onSubmit={handleSendDecree} className="border-t border-[#255325] pt-3">
                <div className="text-[#58ca58] text-[11px] mb-1">DISPATCH GOVERNOR DIRECT DECREE:</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={governorPrompt}
                    onChange={(e) => setGovernorPrompt(e.target.value)}
                    placeholder="Enter directive for vector memory..."
                    className="flex-1 bg-black border border-[#255325] px-2 py-1 text-xs text-white placeholder-[#255325] focus:outline focus:outline-1 focus:outline-[#66ff66]"
                  />
                  <button
                    type="submit"
                    className="border border-[#255325] px-2 py-1 text-xs text-white hover:bg-[#66ff66] hover:text-black transition-none"
                  >
                    [INJECT]
                  </button>
                </div>
              </form>
            </section>
          ) : (
            <div className="border-b border-[#255325] p-4 text-xs text-[#58ca58]">
              NO AGENT NODE SELECTED. CLICK ANY NODE IN THE GRID OR ROSTER TO INSPECT.
            </div>
          )}

          {/* 07: MCP.STREAM // AGENT COGNITIVE DECISION LOG */}
          <section className="flex-1 p-4 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between border-b border-[#255325] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[#58ca58]">06</span>
                <span className="text-white font-bold">mcp.stream</span>
                <span className="text-[#58ca58]">:: REALTIME_THOUGHTS</span>
              </div>
              <span className="text-xs text-[#58ca58]">{thoughtLogs.length} LOGS</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[480px]">
              {thoughtLogs.map((log) => {
                const fCfg = FACTION_CONFIG[log.faction];
                return (
                  <div key={log.id} className="border border-[#255325] p-2 bg-black text-xs">
                    <div className="flex items-center justify-between text-[11px] border-b border-[#255325] pb-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-bold">{log.agentName}</span>
                        <span className="text-[10px]" style={{ color: fCfg?.hex || '#66ff66' }}>
                          [{fCfg?.tag || 'AG'}]
                        </span>
                      </div>
                      <span className="text-[#58ca58]">
                        TICK #{log.tick} // [{log.action}]
                      </span>
                    </div>
                    <p className="text-white text-xs leading-snug">"{log.thought}"</p>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 08: FOOTER MANUAL DIRECTORY                                         */}
      {/* ------------------------------------------------------------------- */}
      <footer className="border-t border-[#255325] px-4 py-2 text-xs text-[#58ca58] flex flex-wrap items-center justify-between gap-y-1 bg-black">
        <div>
          <span>AETHERIA MANUAL // REPO_SPEC: HACKTOBERFEST_MLH // TRACKS: [OPEN_SOURCE_AI, AGENTIC_MCP, WEB3_SOLIDITY, 3D_ISOMETRIC]</span>
        </div>
        <div className="flex items-center gap-4">
          <span>GAS: 12 GWEI</span>
          <span>RPC: CONNECTED</span>
          <span>STATUS: EXECUTION_READY</span>
        </div>
      </footer>
    </div>
  );
}
