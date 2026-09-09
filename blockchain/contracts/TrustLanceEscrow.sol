// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TrustLanceEscrow is ReentrancyGuard {
    // =============================================================
    //                           TYPES
    // =============================================================

    enum MilestoneStatus {
        Pending,
        Submitted,
        Approved,
        Rejected,
        Disputed,
        Paid
    }

    struct Milestone {
        string description;
        uint256 amount;
        MilestoneStatus status;
        string deliverableCID;
    }

    // =============================================================
    //                           STATE
    // =============================================================

    address public immutable client;

    address public freelancer;

    address public immutable disputeResolver;

    Milestone[] public milestones;

    /**
     * @dev Remaining amount locked inside the escrow.
     *
     * Example:
     * Funded with 10 ETH -> totalEscrowed = 10 ETH
     * Paid 3 ETH          -> totalEscrowed = 7 ETH
     */
    uint256 public totalEscrowed;

    bool public cancelled;

    /**
     * @dev Prevents funding more than once.
     *
     * We can change this later if the business model requires
     * additional funding.
     */
    bool public funded;

    // =============================================================
    //                           EVENTS
    // =============================================================

    event ProjectFunded(
        address indexed client,
        uint256 amount
    );

    event FreelancerAwarded(
        address indexed freelancer
    );

    event MilestoneSubmitted(
        uint256 indexed index,
        string cid
    );

    event MilestoneApproved(
        uint256 indexed index,
        uint256 amount
    );

    event MilestoneRejected(
        uint256 indexed index
    );

    event PaymentReleased(
        uint256 indexed index,
        address indexed to,
        uint256 amount
    );

    event DisputeRaised(
        uint256 indexed index
    );

    event DisputeResolved(
        uint256 indexed index,
        bool favorFreelancer
    );

    event ProjectCancelled(
        uint256 refundedAmount
    );

    // =============================================================
    //                          MODIFIERS
    // =============================================================

    modifier onlyClient() {
        require(msg.sender == client, "TrustLance: not client");
        _;
    }

    modifier onlyFreelancer() {
        require(
            msg.sender == freelancer,
            "TrustLance: not freelancer"
        );
        _;
    }

    modifier onlyResolver() {
        require(
            msg.sender == disputeResolver,
            "TrustLance: not resolver"
        );
        _;
    }

    modifier validMilestone(uint256 index) {
        require(
            index < milestones.length,
            "TrustLance: invalid milestone"
        );
        _;
    }

    modifier activeProject() {
        require(
            !cancelled,
            "TrustLance: project cancelled"
        );
        _;
    }

    // =============================================================
    //                         CONSTRUCTOR
    // =============================================================

    constructor(
        address _client,
        address _disputeResolver
    ) {
        require(
            _client != address(0),
            "TrustLance: invalid client"
        );

        require(
            _disputeResolver != address(0),
            "TrustLance: invalid resolver"
        );

        client = _client;
        disputeResolver = _disputeResolver;
    }

    // =============================================================
    //                         FUND ESCROW
    // =============================================================

    /**
     * @notice Fund the escrow and create all milestones.
     *
     * @param amounts       Amount of ETH allocated to each milestone.
     * @param descriptions  Description for each milestone.
     *
     * msg.value must exactly equal:
     *
     * amounts[0] + amounts[1] + ... + amounts[n]
     */
    function fundEscrow(
        uint256[] calldata amounts,
        string[] calldata descriptions
    )
        external
        payable
        onlyClient
        activeProject
    {
        require(
            !funded,
            "TrustLance: already funded"
        );

        require(
            amounts.length > 0,
            "TrustLance: no milestones"
        );

        require(
            amounts.length == descriptions.length,
            "TrustLance: length mismatch"
        );

        uint256 totalAmount;

        for (uint256 i = 0; i < amounts.length; i++) {
            require(
                amounts[i] > 0,
                "TrustLance: zero milestone amount"
            );

            totalAmount += amounts[i];

            milestones.push(
                Milestone({
                    description: descriptions[i],
                    amount: amounts[i],
                    status: MilestoneStatus.Pending,
                    deliverableCID: ""
                })
            );
        }

        require(
            msg.value == totalAmount,
            "TrustLance: incorrect ETH amount"
        );

        funded = true;
        totalEscrowed = msg.value;

        emit ProjectFunded(
            msg.sender,
            msg.value
        );
    }

    // =============================================================
    //                      AWARD FREELANCER
    // =============================================================

    /**
     * @notice Assign a freelancer to the project.
     */
    function awardFreelancer(
        address _freelancer
    )
        external
        onlyClient
        activeProject
    {
        require(
            funded,
            "TrustLance: escrow not funded"
        );

        require(
            _freelancer != address(0),
            "TrustLance: invalid freelancer"
        );

        require(
            freelancer == address(0),
            "TrustLance: freelancer already assigned"
        );

        freelancer = _freelancer;

        emit FreelancerAwarded(
            _freelancer
        );
    }

    // =============================================================
    //                     SUBMIT MILESTONE
    // =============================================================

    /**
     * @notice Freelancer submits a milestone deliverable.
     *
     * The actual file lives on IPFS.
     * Only its CID is stored on-chain.
     */
    function submitMilestone(
        uint256 index,
        string calldata cid
    )
        external
        onlyFreelancer
        activeProject
        validMilestone(index)
    {
        Milestone storage milestone = milestones[index];

        require(
            milestone.status == MilestoneStatus.Pending ||
            milestone.status == MilestoneStatus.Rejected,
            "TrustLance: invalid milestone state"
        );

        require(
            bytes(cid).length > 0,
            "TrustLance: empty CID"
        );

        milestone.status = MilestoneStatus.Submitted;
        milestone.deliverableCID = cid;

        emit MilestoneSubmitted(
            index,
            cid
        );
    }

    // =============================================================
    //                    APPROVE MILESTONE
    // =============================================================

    /**
     * @notice Client approves a submitted milestone.
     *
     * Approval immediately releases the milestone payment
     * to the freelancer.
     */
    function approveMilestone(
        uint256 index
    )
        external
        onlyClient
        activeProject
        validMilestone(index)
        nonReentrant
    {
        require(
            freelancer != address(0),
            "TrustLance: freelancer not assigned"
        );

        Milestone storage milestone = milestones[index];

        require(
            milestone.status == MilestoneStatus.Submitted,
            "TrustLance: milestone not submitted"
        );

        uint256 amount = milestone.amount;

        require(
            amount <= totalEscrowed,
            "TrustLance: insufficient escrow"
        );

        // ---------------------------------------------------------
        // Effects
        // ---------------------------------------------------------

        milestone.status = MilestoneStatus.Approved;

        totalEscrowed -= amount;

        emit MilestoneApproved(
            index,
            amount
        );

        // ---------------------------------------------------------
        // Interaction
        // ---------------------------------------------------------

        (bool success, ) = payable(freelancer).call{
            value: amount
        }("");

        require(
            success,
            "TrustLance: payment failed"
        );

        milestone.status = MilestoneStatus.Paid;

        emit PaymentReleased(
            index,
            freelancer,
            amount
        );
    }

    // =============================================================
    //                     REJECT MILESTONE
    // =============================================================

    /**
     * @notice Client rejects a submitted milestone.
     *
     * No funds are moved.
     */
    function rejectMilestone(
        uint256 index
    )
        external
        onlyClient
        activeProject
        validMilestone(index)
    {
        Milestone storage milestone = milestones[index];

        require(
            milestone.status == MilestoneStatus.Submitted,
            "TrustLance: milestone not submitted"
        );

        milestone.status = MilestoneStatus.Rejected;

        emit MilestoneRejected(index);
    }

    // =============================================================
    //                       RAISE DISPUTE
    // =============================================================

    /**
     * @notice Client or freelancer can dispute a rejected milestone.
     */
    function raiseDispute(
        uint256 index
    )
        external
        activeProject
        validMilestone(index)
    {
        require(
            msg.sender == client ||
            msg.sender == freelancer,
            "TrustLance: unauthorized"
        );

        Milestone storage milestone = milestones[index];

        require(
            milestone.status == MilestoneStatus.Rejected,
            "TrustLance: milestone not rejected"
        );

        milestone.status = MilestoneStatus.Disputed;

        emit DisputeRaised(index);
    }

    // =============================================================
    //                     RESOLVE DISPUTE
    // =============================================================

    /**
     * @notice Resolver settles a disputed milestone.
     *
     * favorFreelancer = true:
     *     freelancer receives milestone amount
     *
     * favorFreelancer = false:
     *     client receives milestone amount
     */
    function resolveDispute(
        uint256 index,
        bool favorFreelancer
    )
        external
        onlyResolver
        validMilestone(index)
        nonReentrant
    {
        require(
            !cancelled,
            "TrustLance: project cancelled"
        );

        Milestone storage milestone = milestones[index];

        require(
            milestone.status == MilestoneStatus.Disputed,
            "TrustLance: milestone not disputed"
        );

        uint256 amount = milestone.amount;

        require(
            amount <= totalEscrowed,
            "TrustLance: insufficient escrow"
        );

        // ---------------------------------------------------------
        // Effects
        // ---------------------------------------------------------

        totalEscrowed -= amount;

        address recipient;

        if (favorFreelancer) {
            require(
                freelancer != address(0),
                "TrustLance: freelancer not assigned"
            );

            recipient = freelancer;
        } else {
            recipient = client;
        }

        milestone.status = MilestoneStatus.Approved;

        emit DisputeResolved(
            index,
            favorFreelancer
        );

        // ---------------------------------------------------------
        // Interaction
        // ---------------------------------------------------------

        (bool success, ) = payable(recipient).call{
            value: amount
        }("");

        require(
            success,
            "TrustLance: resolution payment failed"
        );

        milestone.status = MilestoneStatus.Paid;

        emit PaymentReleased(
            index,
            recipient,
            amount
        );
    }

    // =============================================================
    //                       CANCEL PROJECT
    // =============================================================

    /**
     * @notice Client cancels the project and receives remaining escrow.
     *
     * Already-paid milestones cannot be refunded because their
     * funds have already left the contract.
     */
    function cancelProject()
        external
        onlyClient
        nonReentrant
    {
        require(
            !cancelled,
            "TrustLance: already cancelled"
        );

        cancelled = true;

        uint256 refund = totalEscrowed;

        totalEscrowed = 0;

        if (refund > 0) {
            (bool success, ) = payable(client).call{
                value: refund
            }("");

            require(
                success,
                "TrustLance: refund failed"
            );
        }

        emit ProjectCancelled(
            refund
        );
    }

    // =============================================================
    //                       VIEW FUNCTIONS
    // =============================================================

    /**
     * @notice Number of milestones.
     */
    function getMilestoneCount()
        external
        view
        returns (uint256)
    {
        return milestones.length;
    }

    /**
     * @notice Returns a milestone.
     */
    function getMilestone(
        uint256 index
    )
        external
        view
        validMilestone(index)
        returns (
            string memory description,
            uint256 amount,
            MilestoneStatus status,
            string memory deliverableCID
        )
    {
        Milestone storage milestone = milestones[index];

        return (
            milestone.description,
            milestone.amount,
            milestone.status,
            milestone.deliverableCID
        );
    }

    /**
     * @notice Current ETH held by the contract.
     */
    function getEscrowBalance()
        external
        view
        returns (uint256)
    {
        return address(this).balance;
    }
}