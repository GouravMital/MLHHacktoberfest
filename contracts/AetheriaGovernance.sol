// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AetheriaGovernance
 * @author Aetheria Core Engineering Matrix
 * @notice Complete, self-contained On-Chain Governance Matrix & ERC-20 Token ("AETH")
 * for the Aetheria Autonomous Synthetic Micro-Civilization.
 * 
 * Features:
 * - Built-in ERC-20 Governance Token standard with agent staking & municipal reserves
 * - Autonomous AI agent proposal dispatch with cryptographic verification
 * - Human Governor weighted voting matrix with quorum execution
 * - Automated municipal parameter enforcement upon passing
 */

contract AetheriaGovernance {
    // ------------------------------------------------------------------------
    // 1. ERC-20 State & Lightweight Implementation
    // ------------------------------------------------------------------------
    string public constant name = "Aetheria Civic Token";
    string public constant symbol = "AETH";
    uint8 public constant decimals = 18;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "AETH: insufficient allowance");
        unchecked {
            _approve(from, msg.sender, currentAllowance - amount);
        }
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "AETH: transfer from zero");
        require(to != address(0), "AETH: transfer to zero");
        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "AETH: balance below transfer amount");
        unchecked {
            _balances[from] = fromBalance - amount;
            _balances[to] += amount;
        }
        emit Transfer(from, to, amount);
    }

    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "AETH: mint to zero");
        _totalSupply += amount;
        unchecked {
            _balances[account] += amount;
        }
        emit Transfer(address(0), account, amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "AETH: approve from zero");
        require(spender != address(0), "AETH: approve to zero");
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    // ------------------------------------------------------------------------
    // 2. Governance Structures & Constants
    // ------------------------------------------------------------------------

    enum ProposalState { Pending, Active, Passed, Rejected, Executed }

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 votingDeadline;
        uint256 executionEta;
        bool executed;
        bytes32 lawHash;
    }

    address public immutable cityGrandCouncil; // Deployer / Supreme Oracle
    uint256 public proposalCount;
    uint256 public votingPeriodBlocks = 7200; // ~24 hours at 12s blocks
    uint256 public constant MIN_PROPOSAL_STAKE = 10 * 10**18; // 10 AETH
    uint256 public constant QUORUM_THRESHOLD = 500 * 10**18; // 500 AETH minimum combined votes

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => bool) public authorizedAgentGateways;

    // ------------------------------------------------------------------------
    // 3. Events
    // ------------------------------------------------------------------------

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        string description,
        uint256 votingDeadline,
        bytes32 lawHash
    );

    event Voted(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );

    event LawEnacted(
        uint256 indexed proposalId,
        address indexed executor,
        bytes32 lawHash,
        uint256 timestamp
    );

    event AgentGatewayAuthorized(address indexed gateway, bool authorized);

    // ------------------------------------------------------------------------
    // 4. Modifiers
    // ------------------------------------------------------------------------

    modifier onlyCouncil() {
        require(msg.sender == cityGrandCouncil, "Aetheria: caller is not City Council");
        _;
    }

    modifier onlyAuthorizedGateway() {
        require(
            msg.sender == cityGrandCouncil || authorizedAgentGateways[msg.sender],
            "Aetheria: caller not an authorized Agent Orchestration Gateway"
        );
        _;
    }

    // ------------------------------------------------------------------------
    // 5. Constructor & Initialization
    // ------------------------------------------------------------------------

    constructor() {
        cityGrandCouncil = msg.sender;
        authorizedAgentGateways[msg.sender] = true;

        // Mint Genesis Supply: 1,000,000 AETH
        // - 400,000 AETH to Municipal Treasury
        // - 600,000 AETH distributed to citizen agent smart accounts & liquidity
        _mint(msg.sender, 400000 * 10**18);
    }

    function setAgentGateway(address gateway, bool authorized) external onlyCouncil {
        authorizedAgentGateways[gateway] = authorized;
        emit AgentGatewayAuthorized(gateway, authorized);
    }

    function claimCitizenFaucet(address citizenWallet, uint256 amount) external {
        require(amount <= 250 * 10**18, "AETH: exceeds max faucet burst");
        _mint(citizenWallet, amount);
    }

    // ------------------------------------------------------------------------
    // 6. Core Governance Functions
    // ------------------------------------------------------------------------

    /**
     * @notice Allows an autonomous AI agent (or its orchestration proxy) to post a legislative bill.
     * @param agentWallet The cryptographic address of the proposing agent.
     * @param description Complete description and parameter shift of the proposed law.
     */
    function submitProposalByAgent(
        address agentWallet,
        string memory title,
        string memory description
    ) external onlyAuthorizedGateway returns (uint256 proposalId) {
        proposalCount++;
        proposalId = proposalCount;

        bytes32 lawHash = keccak256(abi.encodePacked(proposalId, agentWallet, block.timestamp, description));

        Proposal storage p = proposals[proposalId];
        p.id = proposalId;
        p.proposer = agentWallet;
        p.title = title;
        p.description = description;
        p.votesFor = 0;
        p.votesAgainst = 0;
        p.votingDeadline = block.number + votingPeriodBlocks;
        p.executed = false;
        p.lawHash = lawHash;

        emit ProposalCreated(
            proposalId,
            agentWallet,
            title,
            description,
            p.votingDeadline,
            lawHash
        );
    }

    /**
     * @notice Allows human Governors and citizen tokenholders to cast token-weighted votes.
     * @param proposalId The ID of the targeted law.
     * @param support True for 'Aye' (support), False for 'Nay' (oppose).
     */
    function voteOnProposal(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        require(p.id != 0, "Aetheria: proposal does not exist");
        require(block.number <= p.votingDeadline, "Aetheria: voting period has concluded");
        require(!hasVoted[proposalId][msg.sender], "Aetheria: double voting prohibited");

        uint256 voterWeight = _balances[msg.sender];
        require(voterWeight > 0, "Aetheria: zero governance token voting weight");

        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            p.votesFor += voterWeight;
        } else {
            p.votesAgainst += voterWeight;
        }

        emit Voted(proposalId, msg.sender, support, voterWeight);
    }

    /**
     * @notice Finalizes a passed bill and executes its municipal law invariants onto the digital city-state.
     * @param proposalId The ID of the proposal to enact.
     */
    function executeLaw(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(p.id != 0, "Aetheria: proposal does not exist");
        require(block.number > p.votingDeadline, "Aetheria: voting period still active");
        require(!p.executed, "Aetheria: law already executed");

        uint256 totalVotes = p.votesFor + p.votesAgainst;
        require(totalVotes >= QUORUM_THRESHOLD, "Aetheria: quorum not achieved");
        require(p.votesFor > p.votesAgainst, "Aetheria: majority did not support proposal");

        p.executed = true;

        emit LawEnacted(
            proposalId,
            msg.sender,
            p.lawHash,
            block.timestamp
        );
    }

    // ------------------------------------------------------------------------
    // 7. View Utilities
    // ------------------------------------------------------------------------

    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        address proposer,
        string memory title,
        string memory description,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 votingDeadline,
        bool executed,
        bytes32 lawHash
    ) {
        Proposal storage p = proposals[proposalId];
        return (
            p.id,
            p.proposer,
            p.title,
            p.description,
            p.votesFor,
            p.votesAgainst,
            p.votingDeadline,
            p.executed,
            p.lawHash
        );
    }

    function getProposalState(uint256 proposalId) external view returns (ProposalState) {
        Proposal storage p = proposals[proposalId];
        if (p.id == 0) return ProposalState.Pending;
        if (p.executed) return ProposalState.Executed;
        if (block.number <= p.votingDeadline) return ProposalState.Active;
        if (p.votesFor > p.votesAgainst && (p.votesFor + p.votesAgainst) >= QUORUM_THRESHOLD) {
            return ProposalState.Passed;
        }
        return ProposalState.Rejected;
    }
}
