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

type ViewMode = 'workstation' | 'grid' | 'citizens' | 'governance' | 'thoughts';

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

  // Navigation & Traversal State
  const [activeTab, setActiveTab] = useState<ViewMode>('workstation');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>('agent_01');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [governorPrompt, setGovernorPrompt] = useState<string>('');
  const [isTxExecuting, setIsTxExecuting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(
    'SYSTEM READY. TIP: CLICK ANY CITIZEN OR USE [PREV/NEXT] TO INSPECT THEIR TELEMETRY.'
  );

  // Beginner Guide Toggle
  const [showBeginnerGuide, setShowBeginnerGuide] = useState<boolean>(true);

  // Faction Filter for Thought Stream
  const [thoughtFilter, setThoughtFilter] = useState<FactionId | 'ALL'>('ALL');

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

  // Selected agent index for easy Prev / Next traversal
  const selectedAgentIndex = worldState.activeAgents.findIndex((a) => a.id === selectedAgentId);
  const selectedAgent = worldState.activeAgents[selectedAgentIndex >= 0 ? selectedAgentIndex : 0] || null;

  const navigateAgent = (direction: 'prev' | 'next') => {
    const total = worldState.activeAgents.length;
    if (total === 0) return;
    const currentIndex = selectedAgentIndex >= 0 ? selectedAgentIndex : 0;
    const nextIndex = direction === 'next' ? (currentIndex + 1) % total : (currentIndex - 1 + total) % total;
    const targetAgent = worldState.activeAgents[nextIndex];
    setSelectedAgentId(targetAgent.id);
    setStatusMessage(`SELECTED: ${targetAgent.name} [${FACTION_CONFIG[targetAgent.factionId].name}]`);
  };

  // Keyboard Navigation Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in the input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === '1') setActiveTab('workstation');
      if (e.key === '2') setActiveTab('grid');
      if (e.key === '3') setActiveTab('citizens');
      if (e.key === '4') setActiveTab('governance');
      if (e.key === '5') setActiveTab('thoughts');
      if (e.key === 'n' || e.key === 'N') navigateAgent('next');
      if (e.key === 'p' || e.key === 'P') navigateAgent('prev');
      if (e.key === ' ') {
        e.preventDefault();
        setIsSimulating((s) => !s);
      }
      if (e.key === '?') {
        setShowBeginnerGuide((g) => !g);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [worldState.activeAgents, selectedAgentIndex]);

  // Simulation Loop Effect
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
      setStatusMessage(`SUCCESS: VOTE CAST [${voteWeight} AETH] ON BILL #${proposalId} // TX: ${simulatedTx}`);
      setTimeout(() => setStatusMessage(null), 6000);
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
      setStatusMessage(`SUCCESS: BILL #${proposalId} PASSED AND ENACTED INTO MUNICIPAL LAW!`);
      setTimeout(() => setStatusMessage(null), 6000);
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
        thought: `Governor triggered environmental condition: ${crisis}. Citizens adjusting strategy.`,
        action: 'IDLE',
      },
      ...prev,
    ]);

    setStatusMessage(`CRISIS TRIGGERED: ${crisis} — CITIZENS ARE REACTING`);
    setTimeout(() => setStatusMessage(null), 5000);
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
    setStatusMessage(`SUCCESS: DECREE INJECTED INTO ${selectedAgent.name.toUpperCase()}'S MEMORY`);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const filteredThoughts = thoughtLogs.filter((t) => thoughtFilter === 'ALL' || t.faction === thoughtFilter);

  return (
    <div className="min-h-screen bg-black text-[#66ff66] font-mono text-[14px] leading-relaxed selection:bg-[#66ff66] selection:text-black flex flex-col">
      {/* ------------------------------------------------------------------- */}
      {/* 1. TOP SESSION MANUAL & QUICK STATUS BAR                            */}
      {/* ------------------------------------------------------------------- */}
      <header className="border-b border-[#255325] px-4 py-2.5 bg-black flex flex-wrap items-center justify-between gap-y-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-white font-bold text-base tracking-wider">AETHERIA</span>
            <span className="text-[#58ca58]">::</span>
            <span className="text-[#58ca58] hidden sm:inline">SYNTHETIC_MICRO_CIVILIZATION</span>
            <span className="terminal-cursor" />
          </div>
          <span className="border border-[#255325] px-1.5 py-0.2 text-[11px] text-[#58ca58]">
            ARBITRUM_L2
          </span>
        </div>

        {/* Live Metrics Header */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span>
            TICK: <span className="text-white font-bold">{worldState.cycleTick}</span>
          </span>
          <span>
            BLOCK: <span className="text-white">#{worldState.blockHeight}</span>
          </span>
          <span>
            FLUX: <span className="text-white font-bold">{worldState.currentWeatherStatus}</span>
          </span>
          <span className="border-l border-[#255325] pl-3">
            YOUR STAKE: <span className="text-white font-bold">{governorAethBalance} AETH</span>
          </span>
          <button
            onClick={() => {
              setGovernorAethBalance((b) => b + 100);
              setStatusMessage('CLAIMED +100 TESTNET AETH GOVERNANCE TOKENS');
            }}
            className="border border-[#255325] px-2 py-0.5 text-[11px] text-[#66ff66] hover:bg-[#66ff66] hover:text-black transition-none focus:outline focus:outline-1 focus:outline-[#66ff66]"
            title="Claim 100 free testnet AETH tokens to vote on proposals"
          >
            [+100 FAUCET]
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------------- */}
      {/* 2. PRIMARY VIEW MODE NAVIGATION TABS (INSTANT TRAVERSAL)           */}
      {/* ------------------------------------------------------------------- */}
      <nav className="border-b border-[#255325] px-4 py-2 bg-black flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <span className="text-[#58ca58] text-xs mr-1 hidden md:inline">NAVIGATE:</span>

          <button
            onClick={() => setActiveTab('workstation')}
            className={`border px-2.5 py-1 text-xs font-bold transition-none ${
              activeTab === 'workstation'
                ? 'border-[#66ff66] bg-[#66ff66] text-black'
                : 'border-[#255325] text-[#66ff66] hover:bg-[#255325] hover:text-white'
            }`}
          >
            [1. WORKSTATION (SPLIT)]
          </button>

          <button
            onClick={() => setActiveTab('grid')}
            className={`border px-2.5 py-1 text-xs font-bold transition-none ${
              activeTab === 'grid'
                ? 'border-[#66ff66] bg-[#66ff66] text-black'
                : 'border-[#255325] text-[#66ff66] hover:bg-[#255325] hover:text-white'
            }`}
          >
            [2. 3D CITY MAP]
          </button>

          <button
            onClick={() => setActiveTab('citizens')}
            className={`border px-2.5 py-1 text-xs font-bold transition-none ${
              activeTab === 'citizens'
                ? 'border-[#66ff66] bg-[#66ff66] text-black'
                : 'border-[#255325] text-[#66ff66] hover:bg-[#255325] hover:text-white'
            }`}
          >
            [3. CITIZENS ({worldState.activeAgents.length})]
          </button>

          <button
            onClick={() => setActiveTab('governance')}
            className={`border px-2.5 py-1 text-xs font-bold transition-none ${
              activeTab === 'governance'
                ? 'border-[#66ff66] bg-[#66ff66] text-black'
                : 'border-[#255325] text-[#66ff66] hover:bg-[#255325] hover:text-white'
            }`}
          >
            [4. ON-CHAIN LAWS ({worldState.pendingProposals.length})]
          </button>

          <button
            onClick={() => setActiveTab('thoughts')}
            className={`border px-2.5 py-1 text-xs font-bold transition-none ${
              activeTab === 'thoughts'
                ? 'border-[#66ff66] bg-[#66ff66] text-black'
                : 'border-[#255325] text-[#66ff66] hover:bg-[#255325] hover:text-white'
            }`}
          >
            [5. THOUGHT STREAM]
          </button>
        </div>

        {/* Beginner Guide Toggle & Hotkey Indicator */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowBeginnerGuide((g) => !g)}
            className={`border px-2 py-0.5 text-xs transition-none ${
              showBeginnerGuide
                ? 'border-[#255325] bg-[#255325] text-white'
                : 'border-[#255325] text-[#58ca58] hover:text-white'
            }`}
          >
            [? {showBeginnerGuide ? 'HIDE GUIDE' : 'BEGINNER GUIDE'}]
          </button>

          <span className="text-[11px] text-[#58ca58] hidden xl:inline">
            HOTKEYS: [1-5]: Tabs | [N/P]: Prev/Next Agent | [Space]: Pause
          </span>
        </div>
      </nav>

      {/* ------------------------------------------------------------------- */}
      {/* 3. COLLAPSIBLE BEGINNER QUICKSTART & 1-CLICK ACTIONS               */}
      {/* ------------------------------------------------------------------- */}
      {showBeginnerGuide && (
        <section className="border-b border-[#255325] p-3 bg-black text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">[BEGINNER_TUTORIAL // WHAT TO DO IN AETHERIA]</span>
              <span className="text-[#58ca58]">:: 4 SIMPLE ACTIONS TO TRY NOW</span>
            </div>
            <button
              onClick={() => setShowBeginnerGuide(false)}
              className="text-[#58ca58] hover:text-white"
            >
              [CLOSE]
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs">
            {/* Step 1 */}
            <div className="border border-[#255325] p-2 flex flex-col justify-between">
              <div>
                <div className="text-white font-bold mb-1">1. INSPECT A CITIZEN</div>
                <p className="text-[#58ca58] text-[11px] mb-2">
                  Each citizen has distinct vector memories, wealth, and faction philosophy.
                </p>
              </div>
              <div className="flex gap-1.5 mt-1">
                <button
                  onClick={() => {
                    setSelectedAgentId('agent_01');
                    setStatusMessage('SELECTED: Nexus-7 [Silicon Cartel]');
                  }}
                  className="border border-[#255325] px-1.5 py-0.5 hover:bg-[#66ff66] hover:text-black text-[11px]"
                >
                  [Nexus-7]
                </button>
                <button
                  onClick={() => {
                    setSelectedAgentId('agent_02');
                    setStatusMessage('SELECTED: Aura-V [Bio-Synthetics]');
                  }}
                  className="border border-[#255325] px-1.5 py-0.5 hover:bg-[#66ff66] hover:text-black text-[11px]"
                >
                  [Aura-V]
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="border border-[#255325] p-2 flex flex-col justify-between">
              <div>
                <div className="text-white font-bold mb-1">2. VOTE ON A LAW</div>
                <p className="text-[#58ca58] text-[11px] mb-2">
                  Use your 500 AETH Governor token stake to support or oppose bills proposed by AI.
                </p>
              </div>
              <button
                onClick={() => handleVote(1, true)}
                className="border border-[#255325] px-2 py-0.5 hover:bg-[#66ff66] hover:text-black text-[11px] self-start"
              >
                [VOTE AYE ON BILL #1]
              </button>
            </div>

            {/* Step 3 */}
            <div className="border border-[#255325] p-2 flex flex-col justify-between">
              <div>
                <div className="text-white font-bold mb-1">3. TRIGGER A CRISIS</div>
                <p className="text-[#58ca58] text-[11px] mb-2">
                  Simulate a municipal brownout to see AI agents scramble to protect power reserves.
                </p>
              </div>
              <button
                onClick={() => handleInjectCrisis('GRID_BROWNOUT')}
                className="border border-[#255325] px-2 py-0.5 hover:bg-[#66ff66] hover:text-black text-[11px] self-start"
              >
                [TRIGGER BROWNOUT]
              </button>
            </div>

            {/* Step 4 */}
            <div className="border border-[#255325] p-2 flex flex-col justify-between">
              <div>
                <div className="text-white font-bold mb-1">4. CYCLE CONTROLS</div>
                <p className="text-[#58ca58] text-[11px] mb-2">
                  Pause the simulation loop anytime or speed it up to 5x speed.
                </p>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setIsSimulating(!isSimulating)}
                  className="border border-[#255325] px-1.5 py-0.5 hover:bg-[#66ff66] hover:text-black text-[11px]"
                >
                  {isSimulating ? '[PAUSE]' : '[RESUME]'}
                </button>
                <button
                  onClick={() => setSimSpeed((s) => (s === 1 ? 2 : s === 2 ? 5 : 1))}
                  className="border border-[#255325] px-1.5 py-0.5 hover:bg-[#66ff66] hover:text-black text-[11px]"
                >
                  [{simSpeed}X]
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 4. NOTIFICATION / STATUS FEEDBACK BANNER                            */}
      {/* ------------------------------------------------------------------- */}
      {statusMessage && (
        <div className="border-b border-[#255325] bg-black px-4 py-1.5 text-xs text-white flex items-center justify-between">
          <span>&gt;&gt; {statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-[#58ca58] hover:text-white px-2">
            [DISMISS]
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 5. VIEW CONTENT CONTAINER BASED ON ACTIVE TAB                       */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ================================================================= */}
        {/* TAB 1: WORKSTATION SPLIT VIEW (Standard view)                     */}
        {/* ================================================================= */}
        {(activeTab === 'workstation' || activeTab === 'grid') && (
          <main className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-[#255325]">
            {/* 3D Map Header with Quick Action Bar */}
            <div className="border-b border-[#255325] px-3 py-2 flex flex-wrap items-center justify-between gap-2 bg-black text-xs">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">3D WIREFRAME CITY MATRIX</span>
                <span className="text-[#58ca58]">:: CLICK ANY NODE TO INSPECT</span>
              </div>

              {/* Prev / Next Node Traversal Controls */}
              <div className="flex items-center gap-2">
                <span className="text-[#58ca58]">TRAVERSE:</span>
                <button
                  onClick={() => navigateAgent('prev')}
                  className="border border-[#255325] px-2 py-0.5 hover:bg-[#66ff66] hover:text-black text-xs transition-none"
                  title="Switch to previous citizen [Hotkey: P]"
                >
                  [&lt; PREV]
                </button>
                <span className="text-white font-bold">{selectedAgent?.name || 'NONE'}</span>
                <button
                  onClick={() => navigateAgent('next')}
                  className="border border-[#255325] px-2 py-0.5 hover:bg-[#66ff66] hover:text-black text-xs transition-none"
                  title="Switch to next citizen [Hotkey: N]"
                >
                  [NEXT &gt;]
                </button>
              </div>
            </div>

            {/* 3D Interactive Canvas */}
            <div className="flex-1 min-h-[380px] lg:min-h-[480px] relative bg-black">
              <CityCanvas
                agents={worldState.activeAgents}
                tradeFlows={worldState.activeTradeFlows}
                selectedAgentId={selectedAgentId}
                onSelectAgent={(id) => {
                  setSelectedAgentId(id);
                  const found = worldState.activeAgents.find((a) => a.id === id);
                  if (found) {
                    setStatusMessage(`INSPECTING: ${found.name} [${FACTION_CONFIG[found.factionId].name}]`);
                  }
                }}
                weather={worldState.currentWeatherStatus}
              />
            </div>

            {/* Quick Municipal Telemetry Ribbon */}
            <div className="border-t border-[#255325] p-2.5 px-3 bg-black flex flex-wrap items-center justify-between text-xs gap-3">
              <div className="flex items-center gap-4">
                <span>
                  ENERGY: <span className="text-white">{worldState.resourceIndex.totalEnergy} MW</span>
                </span>
                <span>
                  COMPUTE: <span className="text-white">{worldState.resourceIndex.totalCompute} TF</span>
                </span>
                <span>
                  BIOMASS: <span className="text-white">{worldState.resourceIndex.totalBiomass} KG</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#58ca58]">QUICK CRISIS:</span>
                <button
                  onClick={() => handleInjectCrisis('GRID_BROWNOUT')}
                  className="border border-[#255325] px-1.5 py-0.5 hover:bg-[#66ff66] hover:text-black text-[11px]"
                >
                  [BROWNOUT]
                </button>
                <button
                  onClick={() => handleInjectCrisis('SOLAR_FLARE')}
                  className="border border-[#255325] px-1.5 py-0.5 hover:bg-[#66ff66] hover:text-black text-[11px]"
                >
                  [SOLAR FLARE]
                </button>
                <button
                  onClick={() => handleInjectCrisis('OPTIMAL_FLUX')}
                  className="border border-[#255325] px-1.5 py-0.5 hover:bg-[#66ff66] hover:text-black text-[11px]"
                >
                  [NORMALIZE]
                </button>
              </div>
            </div>
          </main>
        )}

        {/* ================================================================= */}
        {/* TAB 3: CITIZENS DIRECTORY (Full Roster & Comparison)              */}
        {/* ================================================================= */}
        {activeTab === 'citizens' && (
          <main className="flex-1 p-4 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#255325] pb-2 mb-3">
              <div>
                <h2 className="text-white font-bold text-base">CITIZEN AGENT DIRECTORY</h2>
                <p className="text-xs text-[#58ca58]">
                  Click any citizen row to lock target and inspect neural memory buffers.
                </p>
              </div>
              <span className="text-xs text-[#58ca58]">{worldState.activeAgents.length} CITIZENS REGISTERED</span>
            </div>

            <div className="overflow-x-auto mb-4">
              <table className="w-full text-left text-xs border border-[#255325] border-collapse">
                <thead>
                  <tr className="border-b border-[#255325] text-[#58ca58] bg-black">
                    <th className="p-2 border-r border-[#255325]">ID</th>
                    <th className="p-2 border-r border-[#255325]">NAME</th>
                    <th className="p-2 border-r border-[#255325]">FACTION AFFILIATION</th>
                    <th className="p-2 border-r border-[#255325]">DISTRICT</th>
                    <th className="p-2 border-r border-[#255325]">STATUS</th>
                    <th className="p-2 border-r border-[#255325]">AETH STAKE</th>
                    <th className="p-2 border-r border-[#255325]">COMPUTE</th>
                    <th className="p-2">SELECT</th>
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
                          isSelected ? 'bg-[#66ff66] text-black font-bold' : 'hover:bg-[#001400]'
                        }`}
                      >
                        <td className="p-2 border-r border-[#255325]">{ag.id}</td>
                        <td className="p-2 border-r border-[#255325] text-white">
                          {isSelected ? `> ${ag.name}` : ag.name}
                        </td>
                        <td className="p-2 border-r border-[#255325]">
                          <span
                            className="px-1 border border-current font-bold"
                            style={{ color: isSelected ? '#000000' : fConfig.hex }}
                          >
                            [{fConfig.tag}] {fConfig.name}
                          </span>
                        </td>
                        <td className="p-2 border-r border-[#255325]">{ag.district}</td>
                        <td className="p-2 border-r border-[#255325] uppercase">{ag.currentAction}</td>
                        <td className="p-2 border-r border-[#255325]">{ag.wealth.aethTokens} AETH</td>
                        <td className="p-2 border-r border-[#255325]">{ag.wealth.computeCredits} TF</td>
                        <td className="p-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAgentId(ag.id);
                              setActiveTab('workstation');
                            }}
                            className={`border px-1.5 py-0.5 text-xs ${
                              isSelected
                                ? 'border-black text-black'
                                : 'border-[#255325] hover:bg-[#66ff66] hover:text-black'
                            }`}
                          >
                            [INSPECT 3D]
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </main>
        )}

        {/* ================================================================= */}
        {/* TAB 4: GOVERNANCE MATRIX (Full Proposals View)                    */}
        {/* ================================================================= */}
        {activeTab === 'governance' && (
          <main className="flex-1 p-4 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#255325] pb-2 mb-3">
              <div>
                <h2 className="text-white font-bold text-base">ON-CHAIN GOVERNANCE MATRIX</h2>
                <p className="text-xs text-[#58ca58]">
                  Bills autonomously formulated and broadcasted by citizen agents. Human Governors vote with AETH weight.
                </p>
              </div>
              <span className="text-xs text-[#58ca58]">
                CONTRACT: {worldState.onChainContractAddress.slice(0, 16)}...
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {worldState.pendingProposals.map((prop) => {
                const totalVotes = prop.votesFor + prop.votesAgainst;
                const forPercent = totalVotes > 0 ? (prop.votesFor / totalVotes) * 100 : 50;
                const hasVoted = votedProposalIds[prop.id];
                const meetsQuorum = totalVotes >= 500;
                const proposingAgent = worldState.activeAgents.find((a) => a.id === prop.proposedByAgentId);
                const pFaction = proposingAgent ? FACTION_CONFIG[proposingAgent.factionId] : null;

                return (
                  <div key={prop.id} className="border border-[#255325] p-3.5 bg-black flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 border-b border-[#255325] pb-2 mb-2">
                        <div>
                          <div className="text-white font-bold text-sm">BILL #{prop.id}: {prop.title}</div>
                          {pFaction && (
                            <div className="text-[11px] mt-0.5" style={{ color: pFaction.hex }}>
                              SPONSOR: [{pFaction.tag}] {pFaction.name} ({proposingAgent?.name})
                            </div>
                          )}
                        </div>
                        <span className="border border-[#255325] px-1 text-[11px] text-[#58ca58]">
                          {prop.category}
                        </span>
                      </div>

                      <p className="text-xs text-[#58ca58] mb-3">{prop.description}</p>

                      <div className="text-[11px] text-[#58ca58] mb-2 space-y-0.5">
                        <div>TX: {prop.transactionHash.slice(0, 26)}...</div>
                        <div>PROPOSER WALLET: {prop.proposerWallet}</div>
                      </div>

                      {/* Quorum Character Progress */}
                      <div className="border border-[#255325] p-2 mb-3 text-xs bg-black">
                        <div className="flex justify-between mb-1">
                          <span className="text-white">AYE: {prop.votesFor} AETH</span>
                          <span className={meetsQuorum ? 'text-[#66ff66] font-bold' : 'text-white'}>
                            QUORUM: {totalVotes}/500 {meetsQuorum ? '[READY]' : '[PENDING]'}
                          </span>
                          <span>NAY: {prop.votesAgainst} AETH</span>
                        </div>
                        <div className="text-xs text-[#58ca58]">
                          [{'#'.repeat(Math.round(forPercent / 4))}
                          {'.'.repeat(Math.max(0, 25 - Math.round(forPercent / 4)))}] {forPercent.toFixed(1)}% FOR
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#255325]">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVote(prop.id, true)}
                          disabled={hasVoted || isTxExecuting}
                          className="border border-[#255325] px-2.5 py-1 text-white hover:bg-[#66ff66] hover:text-black transition-none text-xs disabled:opacity-40"
                        >
                          [VOTE AYE]
                        </button>
                        <button
                          onClick={() => handleVote(prop.id, false)}
                          disabled={hasVoted || isTxExecuting}
                          className="border border-[#255325] px-2.5 py-1 text-[#58ca58] hover:bg-[#66ff66] hover:text-black transition-none text-xs disabled:opacity-40"
                        >
                          [VOTE NAY]
                        </button>
                      </div>

                      {meetsQuorum && (
                        <button
                          onClick={() => handleExecuteLaw(prop.id)}
                          disabled={isTxExecuting}
                          className="border border-[#66ff66] bg-[#66ff66] text-black font-bold px-3 py-1 text-xs hover:bg-white"
                        >
                          [ENACT LAW]
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        )}

        {/* ================================================================= */}
        {/* TAB 5: COGNITIVE THOUGHT STREAM (Dedicated View)                  */}
        {/* ================================================================= */}
        {activeTab === 'thoughts' && (
          <main className="flex-1 p-4 overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between border-b border-[#255325] pb-2 mb-3 gap-2">
              <div>
                <h2 className="text-white font-bold text-base">AUTONOMOUS COGNITIVE THOUGHT STREAM</h2>
                <p className="text-xs text-[#58ca58]">
                  Real-time internal monologues and strategic calculations from citizen agents.
                </p>
              </div>

              {/* Faction Filter Buttons */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[#58ca58]">FILTER:</span>
                <button
                  onClick={() => setThoughtFilter('ALL')}
                  className={`border px-2 py-0.5 ${
                    thoughtFilter === 'ALL' ? 'bg-[#66ff66] text-black font-bold' : 'border-[#255325]'
                  }`}
                >
                  ALL
                </button>
                {Object.entries(FACTION_CONFIG).map(([k, f]) => (
                  <button
                    key={k}
                    onClick={() => setThoughtFilter(k as FactionId)}
                    className={`border px-1.5 py-0.5 text-[11px] ${
                      thoughtFilter === k ? 'bg-white text-black font-bold' : 'border-[#255325]'
                    }`}
                    style={{ color: thoughtFilter === k ? '#000000' : f.hex }}
                  >
                    [{f.tag}]
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {filteredThoughts.map((log) => {
                const fCfg = FACTION_CONFIG[log.faction];
                return (
                  <div key={log.id} className="border border-[#255325] p-2.5 bg-black text-xs">
                    <div className="flex items-center justify-between border-b border-[#255325] pb-1 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{log.agentName}</span>
                        <span className="px-1 text-[11px] border border-current font-bold" style={{ color: fCfg?.hex }}>
                          [{fCfg?.tag}] {fCfg?.name}
                        </span>
                      </div>
                      <span className="text-[#58ca58]">
                        TICK #{log.tick} // [{log.action}]
                      </span>
                    </div>
                    <p className="text-white text-xs leading-relaxed">"{log.thought}"</p>
                  </div>
                );
              })}
            </div>
          </main>
        )}

        {/* ================================================================= */}
        {/* RIGHT SIDE PANEL: SELECTED CITIZEN TELEMETRY & CONTROLS           */}
        {/* Always visible in Workstation tab, collapsible in other views      */}
        {/* ================================================================= */}
        {activeTab === 'workstation' && (
          <aside className="w-full lg:w-[440px] flex flex-col bg-black overflow-y-auto border-t lg:border-t-0 border-[#255325]">
            {selectedAgent ? (
              <div className="p-4 space-y-4">
                {/* Node Inspection Header */}
                <div className="flex items-center justify-between border-b border-[#255325] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm">CITIZEN TELEMETRY</span>
                    <span className="text-[#58ca58]">:: [{selectedAgent.id}]</span>
                  </div>

                  {/* Prev / Next controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => navigateAgent('prev')}
                      className="border border-[#255325] px-1.5 py-0.5 text-xs hover:bg-[#66ff66] hover:text-black"
                    >
                      [&lt;]
                    </button>
                    <button
                      onClick={() => navigateAgent('next')}
                      className="border border-[#255325] px-1.5 py-0.5 text-xs hover:bg-[#66ff66] hover:text-black"
                    >
                      [&gt;]
                    </button>
                  </div>
                </div>

                {/* Identity & Faction */}
                <div className="border border-[#255325] p-2.5 bg-black space-y-1 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="text-white font-bold text-base">{selectedAgent.name}</span>
                    <span className="text-[#58ca58]">REP: {selectedAgent.reputation}/100</span>
                  </div>

                  {/* Faction Badge */}
                  <div className="flex items-center justify-between pt-1">
                    <span
                      className="font-bold text-sm"
                      style={{ color: FACTION_CONFIG[selectedAgent.factionId].hex }}
                    >
                      [{FACTION_CONFIG[selectedAgent.factionId].tag}] {FACTION_CONFIG[selectedAgent.factionId].name}
                    </span>
                    <span className="text-[#58ca58] text-[11px]">
                      ZONE: {selectedAgent.district}
                    </span>
                  </div>

                  <p className="text-[#58ca58] italic pt-1 text-[11px] leading-snug">
                    "{selectedAgent.persona}"
                  </p>
                </div>

                {/* Balances */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="border border-[#255325] p-2">
                    <div className="text-[#58ca58] text-[10px]">AETH BALANCE:</div>
                    <div className="text-white font-bold">{selectedAgent.wealth.aethTokens} AETH</div>
                  </div>
                  <div className="border border-[#255325] p-2">
                    <div className="text-[#58ca58] text-[10px]">COMPUTE CREDITS:</div>
                    <div className="text-white font-bold">{selectedAgent.wealth.computeCredits} TF</div>
                  </div>
                  <div className="border border-[#255325] p-2">
                    <div className="text-[#58ca58] text-[10px]">ENERGY UNITS:</div>
                    <div className="text-white font-bold">{selectedAgent.wealth.energyUnits} MW</div>
                  </div>
                  <div className="border border-[#255325] p-2">
                    <div className="text-[#58ca58] text-[10px]">BIOMASS UNITS:</div>
                    <div className="text-white font-bold">{selectedAgent.wealth.biomassUnits} KG</div>
                  </div>
                </div>

                {/* Cognitive Alignment Meters */}
                <div className="border border-[#255325] p-2.5 text-xs space-y-2">
                  <div className="text-[#58ca58] text-[11px] font-bold">ETHICAL & ALIGNMENT MATRIX:</div>

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

                {/* Memory Buffer */}
                <div className="border border-[#255325] p-2.5 text-xs">
                  <div className="text-[#58ca58] text-[11px] font-bold mb-1.5">
                    EPISODIC VECTOR MEMORIES (COSINE SEARCH):
                  </div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {selectedAgent.memoryLogs.map((mem) => (
                      <div key={mem.id} className="border border-[#255325] p-1.5 text-xs bg-black">
                        <div className="flex justify-between text-[10px] text-[#58ca58]">
                          <span>TICK #{mem.cycleTick}</span>
                          <span className="text-white">
                            VALENCE: {mem.emotionalValence > 0 ? '+' : ''}
                            {mem.emotionalValence.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-white text-[11px] leading-tight mt-0.5">{mem.eventDescription}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Send Decree */}
                <form onSubmit={handleSendDecree} className="border border-[#255325] p-2.5 text-xs">
                  <div className="text-[#58ca58] text-[11px] font-bold mb-1">
                    ISSUE DIRECT GOVERNOR DECREE:
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={governorPrompt}
                      onChange={(e) => setGovernorPrompt(e.target.value)}
                      placeholder="Type a municipal order to inject..."
                      className="flex-1 bg-black border border-[#255325] px-2 py-1 text-xs text-white placeholder-[#255325] focus:outline focus:outline-1 focus:outline-[#66ff66]"
                    />
                    <button
                      type="submit"
                      className="border border-[#255325] px-2 py-1 text-xs text-white hover:bg-[#66ff66] hover:text-black transition-none font-bold"
                    >
                      [SEND]
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="p-4 text-xs text-[#58ca58]">
                NO CITIZEN SELECTED. CLICK ANY NODE IN THE 3D MAP OR USE [NEXT] TO INSPECT.
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 6. BOTTOM COMMAND SUMMARY DIRECTORY                                 */}
      {/* ------------------------------------------------------------------- */}
      <footer className="border-t border-[#255325] px-4 py-2 text-xs text-[#58ca58] flex flex-wrap items-center justify-between gap-y-1 bg-black">
        <div className="flex items-center gap-4">
          <span className="text-white font-bold">AETHERIA WORKSTATION</span>
          <span>CITIZENS: {worldState.activeAgents.length}</span>
          <span>BILLS: {worldState.pendingProposals.length}</span>
          <span>QUORUM: 500 AETH</span>
        </div>
        <div className="flex items-center gap-3">
          <span>GAS: 12 GWEI</span>
          <span>RPC: ARBITRUM_TESTNET</span>
          <button
            onClick={() => {
              setActiveTab('workstation');
              setStatusMessage('RESET WORKSTATION VIEW');
            }}
            className="hover:text-white"
          >
            [RESET VIEW]
          </button>
        </div>
      </footer>
    </div>
  );
}
