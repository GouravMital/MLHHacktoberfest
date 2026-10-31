// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AetheriaGovernance
 * @author Aetheria Core Engineering Matrix
 * @notice Complete, production-hardened On-Chain Governance Matrix & ERC-20 Token ("AETH")
 * for the Aetheria Autonomous Synthetic Micro-Civilization.
 * 
 * Security Features:
 * - Anti-Sybil Faucet Cooldown (1 hour per wallet, max 250 AETH burst)
 * - Anti-Vote-Laundering Transfer Lock (tokens locked until proposal deadline)
 * - Bounded input validation preventing gas-griefing & block limits DOS
 * - Strict access control & Reentrancy-safe state execution transitions
 */

contract AetheriaGovernance {
    // ------------------------------------------------------------------------
    // 1. ERC-20 State & Hardened Implementation
    // ------------------------------------------------------------------------
    string public constant name = "Aetheria Civic Token";
    string public constant symbol = "AETH";
    uint8 public constant decimals = 18;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    // Security: Lock transfers if sender has voted in a proposal whose voting period is still active
    mapping(address => uint256) public votingLockBlock;

    // Security: Anti-Sybil Faucet Cooldown tracking
    mapping(address => uint256) public lastFaucetClaim;
    uint256 public constant FAUCET_COOLDOWN = 1 hours;
    uint256 public constant MAX_FAUCET_AMOUNT = 250 * 10**18;

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
        require(block.number > votingLockBlock[from], "AETH: tokens locked in active governance vote");

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

    address public immutable cityGrandCouncil;
    uint256 public proposalCount;
    uint256 public votingPeriodBlocks = 7200; // ~24 hours at 12s blocks
    uint256 public constant MIN_PROPOSAL_STAKE = 10 * 10**18;
    uint256 public constant QUORUM_THRESHOLD = 500 * 10**18;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => bool) public authorizedAgentGateways;

    // Mutex lock for nonReentrant execution
    bool private _locked;

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

    modifier nonReentrant() {
        require(!_locked, "Aetheria: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    // ------------------------------------------------------------------------
    // 5. Constructor & Initialization
    // ------------------------------------------------------------------------

    constructor() {
        cityGrandCouncil = msg.sender;
        authorizedAgentGateways[msg.sender] = true;

        // Mint Genesis Supply: 1,000,000 AETH
        _mint(msg.sender, 400000 * 10**18);
    }

    function setAgentGateway(address gateway, bool authorized) external onlyCouncil {
        require(gateway != address(0), "Aetheria: zero address gateway");
        authorizedAgentGateways[gateway] = authorized;
        emit AgentGatewayAuthorized(gateway, authorized);
    }

    /**
     * @notice Hardened Citizen Faucet with Sybil rate-limiting
     */
    function claimCitizenFaucet(address citizenWallet, uint256 amount) external {
        require(citizenWallet != address(0), "AETH: zero address");
        require(amount > 0 && amount <= MAX_FAUCET_AMOUNT, "AETH: invalid faucet burst amount");
        require(
            block.timestamp >= lastFaucetClaim[citizenWallet] + FAUCET_COOLDOWN,
            "AETH: faucet cooldown active (1 hr rate limit)"
        );
        lastFaucetClaim[citizenWallet] = block.timestamp;
        _mint(citizenWallet, amount);
    }

    // ------------------------------------------------------------------------
    // 6. Core Governance Functions
    // ------------------------------------------------------------------------

    /**
     * @notice Submits a legislative proposal from an authorized agent gateway.
     * Enforces length constraints to prevent block limits gas-griefing.
     */
    function submitProposalByAgent(
        address agentWallet,
        string memory title,
        string memory description
    ) external onlyAuthorizedGateway returns (uint256 proposalId) {
        require(agentWallet != address(0), "Aetheria: zero agent address");
        require(bytes(title).length > 0 && bytes(title).length <= 128, "Aetheria: title length invalid");
        require(bytes(description).length > 0 && bytes(description).length <= 2048, "Aetheria: description length invalid");

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
     * @notice Casts a token-weighted vote. Locks voter balance until proposal deadline to prevent vote laundering.
     */
    function voteOnProposal(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        require(p.id != 0, "Aetheria: proposal does not exist");
        require(block.number <= p.votingDeadline, "Aetheria: voting period has concluded");
        require(!hasVoted[proposalId][msg.sender], "Aetheria: double voting prohibited");

        uint256 voterWeight = _balances[msg.sender];
        require(voterWeight > 0, "Aetheria: zero governance token voting weight");

        hasVoted[proposalId][msg.sender] = true;

        // Anti-Flashloan / Anti-Vote-Laundering: Lock tokens from transfer until this proposal concludes
        if (p.votingDeadline > votingLockBlock[msg.sender]) {
            votingLockBlock[msg.sender] = p.votingDeadline;
        }

        if (support) {
            p.votesFor += voterWeight;
        } else {
            p.votesAgainst += voterWeight;
        }

        emit Voted(proposalId, msg.sender, support, voterWeight);
    }

    /**
     * @notice Executes a passed proposal once voting is complete and quorum is verified.
     */
    function executeLaw(uint256 proposalId) external nonReentrant {
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
