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
        Paid,
        Refunded
    }

    struct Milestone {
        string description;
        uint256 amount;
        MilestoneStatus status;
        string deliverableCID;
        // Timestamp when freelancer submitted the milestone.
        uint256 submittedAt;
        // Timestamp until which client can review/reject it.
        uint256 reviewDeadline;
        // Timestamp until which a dispute can be resolved.
        uint256 disputeDeadline;
    }

    // =============================================================
    //                           STATE
    // =============================================================

    address public immutable client;

    address public freelancer;

    Milestone[] public milestones;

    /**
     * @dev Remaining amount locked inside the escrow.
     */
    uint256 public totalEscrowed;

    bool public cancelled;

    bool public funded;

    /**
     * @dev How long the client has to review a submitted milestone.
     *
     * Example:
     * 7 days means the client has 7 days to approve/reject.
     *
     * If the client does nothing, the milestone can be
     * automatically approved after this period.
     */
    uint256 public immutable clientReviewPeriod;

    /**
     * @dev How long a disputed milestone remains open.
     *
     * If neither party takes action before this deadline,
     * the freelancer receives the milestone payment.
     */
    uint256 public immutable disputePeriod;

    /**
     * @dev Used for mutual cancellation.
     *
     * Client requests cancellation.
     * Freelancer then confirms it.
     *
     * Once both parties agree, the remaining escrow is returned
     * to the client.
     */
    bool public clientCancellationRequested;

    bool public freelancerCancellationRequested;

    // =============================================================
    //                           EVENTS
    // =============================================================

    event ProjectFunded(address indexed client, uint256 amount);

    event FreelancerAwarded(address indexed freelancer);

    event MilestoneSubmitted(
        uint256 indexed index,
        string cid,
        uint256 reviewDeadline
    );

    event MilestoneApproved(uint256 indexed index, uint256 amount);

    event MilestoneRejected(uint256 indexed index);

    event MilestoneAutoApproved(uint256 indexed index, uint256 amount);

    event DisputeRaised(uint256 indexed index, uint256 disputeDeadline);

    event DisputeResolvedForFreelancer(uint256 indexed index, uint256 amount);

    event DisputeResolvedForClient(uint256 indexed index, uint256 amount);

    event ProjectCancellationRequested(address indexed requestedBy);

    event ProjectCancelled(uint256 refundedAmount);

    event PaymentReleased(
        uint256 indexed index,
        address indexed to,
        uint256 amount
    );

    // =============================================================
    //                         MODIFIERS
    // =============================================================

    modifier onlyClient() {
        require(msg.sender == client, "TrustLance: not client");
        _;
    }

    modifier onlyFreelancer() {
        require(msg.sender == freelancer, "TrustLance: not freelancer");
        _;
    }

    modifier validMilestone(uint256 index) {
        require(index < milestones.length, "TrustLance: invalid milestone");
        _;
    }

    modifier activeProject() {
        require(!cancelled, "TrustLance: project cancelled");
        _;
    }

    // =============================================================
    //                        CONSTRUCTOR
    // =============================================================

    constructor(
        address _client,
        uint256 _clientReviewPeriod,
        uint256 _disputePeriod
    ) {
        require(_client != address(0), "TrustLance: invalid client");

        require(_clientReviewPeriod > 0, "TrustLance: invalid review period");

        require(_disputePeriod > 0, "TrustLance: invalid dispute period");

        client = _client;
        clientReviewPeriod = _clientReviewPeriod;
        disputePeriod = _disputePeriod;
    }

    // =============================================================
    //                         FUND ESCROW
    // =============================================================

    /**
     * @notice Fund the escrow and create all milestones.
     *
     * msg.value must exactly equal the sum of all milestone amounts.
     */
    function fundEscrow(
        uint256[] calldata amounts,
        string[] calldata descriptions
    ) external payable onlyClient activeProject {
        require(!funded, "TrustLance: already funded");

        require(amounts.length > 0, "TrustLance: no milestones");

        require(
            amounts.length == descriptions.length,
            "TrustLance: length mismatch"
        );

        uint256 totalAmount;

        for (uint256 i = 0; i < amounts.length; i++) {
            require(amounts[i] > 0, "TrustLance: zero milestone amount");

            totalAmount += amounts[i];

            milestones.push(
                Milestone({
                    description: descriptions[i],
                    amount: amounts[i],
                    status: MilestoneStatus.Pending,
                    deliverableCID: "",
                    submittedAt: 0,
                    reviewDeadline: 0,
                    disputeDeadline: 0
                })
            );
        }

        require(msg.value == totalAmount, "TrustLance: incorrect ETH amount");

        funded = true;

        totalEscrowed = msg.value;

        emit ProjectFunded(msg.sender, msg.value);
    }

    // =============================================================
    //                      AWARD FREELANCER
    // =============================================================

    /**
     * @notice Assign a freelancer to the project.
     */
    function awardFreelancer(
        address _freelancer
    ) external onlyClient activeProject {
        require(funded, "TrustLance: escrow not funded");

        require(_freelancer != address(0), "TrustLance: invalid freelancer");

        require(
            freelancer == address(0),
            "TrustLance: freelancer already assigned"
        );

        freelancer = _freelancer;

        emit FreelancerAwarded(_freelancer);
    }

    // =============================================================
    //                    SUBMIT MILESTONE
    // =============================================================

    /**
     * @notice Freelancer submits a milestone deliverable.
     *
     * The actual file lives on IPFS.
     * Only its CID is stored on-chain.
     *
     * A review deadline is automatically created.
     */
    function submitMilestone(
        uint256 index,
        string calldata cid
    ) external onlyFreelancer activeProject validMilestone(index) {
        Milestone storage milestone = milestones[index];

        require(
            milestone.status == MilestoneStatus.Pending ||
                milestone.status == MilestoneStatus.Rejected,
            "TrustLance: invalid milestone state"
        );

        require(bytes(cid).length > 0, "TrustLance: empty CID");

        milestone.status = MilestoneStatus.Submitted;

        milestone.deliverableCID = cid;

        milestone.submittedAt = block.timestamp;

        milestone.reviewDeadline = block.timestamp + clientReviewPeriod;

        milestone.disputeDeadline = 0;

        emit MilestoneSubmitted(index, cid, milestone.reviewDeadline);
    }

    // =============================================================
    //                    APPROVE MILESTONE
    // =============================================================

    /**
     * @notice Client manually approves a submitted milestone.
     *
     * Payment is immediately released to freelancer.
     */
    function approveMilestone(
        uint256 index
    ) external onlyClient activeProject validMilestone(index) nonReentrant {
        Milestone storage milestone = milestones[index];

        require(
            milestone.status == MilestoneStatus.Submitted,
            "TrustLance: milestone not submitted"
        );

        _payFreelancer(index, milestone);
    }

    // =============================================================
    //                 AUTO APPROVE MILESTONE
    // =============================================================

    /**
     * @notice Automatically approves a milestone when the client
     *         fails to respond within the review period.
     *
     * Anyone can call this function once the deadline has passed.
     *
     * This is important because the blockchain cannot wake itself up.
     */
    function autoApproveMilestone(
        uint256 index
    ) external activeProject validMilestone(index) nonReentrant {
        Milestone storage milestone = milestones[index];

        require(
            milestone.status == MilestoneStatus.Submitted,
            "TrustLance: milestone not submitted"
        );

        require(
            block.timestamp >= milestone.reviewDeadline,
            "TrustLance: review period active"
        );

        uint256 amount = milestone.amount;

        require(amount <= totalEscrowed, "TrustLance: insufficient escrow");

        totalEscrowed -= amount;

        milestone.status = MilestoneStatus.Approved;

        emit MilestoneAutoApproved(index, amount);

        _sendPayment(freelancer, amount);

        milestone.status = MilestoneStatus.Paid;

        emit PaymentReleased(index, freelancer, amount);
    }

    // =============================================================
    //                    REJECT MILESTONE
    // =============================================================

    /**
     * @notice Client rejects a submitted milestone.
     *
     * No funds move.
     */
    function rejectMilestone(
        uint256 index
    ) external onlyClient activeProject validMilestone(index) {
        Milestone storage milestone = milestones[index];

        require(
            milestone.status == MilestoneStatus.Submitted,
            "TrustLance: milestone not submitted"
        );

        require(
            block.timestamp < milestone.reviewDeadline,
            "TrustLance: review period expired"
        );

        milestone.status = MilestoneStatus.Rejected;

        emit MilestoneRejected(index);
    }

    // =============================================================
    //                       RAISE DISPUTE
    // =============================================================

    /**
     * @notice Freelancer can dispute a rejected milestone.
     *
     * Once disputed, a deterministic dispute window begins.
     */
    function raiseDispute(
        uint256 index
    ) external onlyFreelancer activeProject validMilestone(index) {
        Milestone storage milestone = milestones[index];

        require(
            milestone.status == MilestoneStatus.Rejected,
            "TrustLance: milestone not rejected"
        );

        milestone.status = MilestoneStatus.Disputed;

        milestone.disputeDeadline = block.timestamp + disputePeriod;

        emit DisputeRaised(index, milestone.disputeDeadline);
    }

    // =============================================================
    //              CLIENT WITHDRAWS REJECTION
    // =============================================================

    /**
     * @notice Client accepts the freelancer's dispute.
     *
     * This means the client agrees that the milestone should
     * be paid.
     */
    function withdrawRejection(
        uint256 index
    ) external onlyClient activeProject validMilestone(index) nonReentrant {
        Milestone storage milestone = milestones[index];

        require(
            milestone.status == MilestoneStatus.Disputed,
            "TrustLance: milestone not disputed"
        );

        require(
            block.timestamp < milestone.disputeDeadline,
            "TrustLance: dispute period expired"
        );

        uint256 amount = milestone.amount;

        require(amount <= totalEscrowed, "TrustLance: insufficient escrow");

        totalEscrowed -= amount;

        milestone.status = MilestoneStatus.Approved;

        emit DisputeResolvedForFreelancer(index, amount);

        _sendPayment(freelancer, amount);

        milestone.status = MilestoneStatus.Paid;

        emit PaymentReleased(index, freelancer, amount);
    }

    // =============================================================
    //                FREELANCER ACCEPTS REJECTION
    // =============================================================

    /**
     * @notice Freelancer accepts the client's rejection.
     *
     * The milestone amount is returned to the client.
     */
    function acceptRejection(
        uint256 index
    ) external onlyFreelancer activeProject validMilestone(index) nonReentrant {
        Milestone storage milestone = milestones[index];

        require(
            milestone.status == MilestoneStatus.Disputed,
            "TrustLance: milestone not disputed"
        );

        require(
            block.timestamp < milestone.disputeDeadline,
            "TrustLance: dispute period expired"
        );

        _refundMilestoneToClient(index, milestone);
    }

    // =============================================================
    //                AUTO RESOLVE DISPUTE
    // =============================================================

    /**
     * @notice Automatically resolves a dispute after the dispute
     *         period expires.
     *
     * Rule:
     *
     * If neither party reaches an agreement during the dispute
     * period, the freelancer receives the milestone payment.
     *
     * Anyone can call this after the deadline.
     */
    function autoResolveDispute(
        uint256 index
    ) external activeProject validMilestone(index) nonReentrant {
        Milestone storage milestone = milestones[index];

        require(
            milestone.status == MilestoneStatus.Disputed,
            "TrustLance: milestone not disputed"
        );

        require(
            block.timestamp >= milestone.disputeDeadline,
            "TrustLance: dispute period active"
        );

        uint256 amount = milestone.amount;

        require(amount <= totalEscrowed, "TrustLance: insufficient escrow");

        totalEscrowed -= amount;

        milestone.status = MilestoneStatus.Approved;

        emit DisputeResolvedForFreelancer(index, amount);

        _sendPayment(freelancer, amount);

        milestone.status = MilestoneStatus.Paid;

        emit PaymentReleased(index, freelancer, amount);
    }

    // =============================================================
    //                   MUTUAL CANCELLATION
    // =============================================================

    /**
     * @notice Client requests project cancellation.
     *
     * Freelancer must also confirm.
     */
    function requestCancellation() external activeProject {
        require(
            msg.sender == client || msg.sender == freelancer,
            "TrustLance: unauthorized"
        );

        if (msg.sender == client) {
            clientCancellationRequested = true;
        } else {
            freelancerCancellationRequested = true;
        }

        emit ProjectCancellationRequested(msg.sender);

        if (clientCancellationRequested && freelancerCancellationRequested) {
            _cancelProject();
        }
    }

    // =============================================================
    //                 CLIENT-ONLY CANCELLATION
    // =============================================================

    /**
     * @notice Client can cancel before a freelancer is assigned.
     *
     * Once a freelancer is assigned, mutual cancellation is
     * required.
     */
    function cancelProjectBeforeAward() external onlyClient nonReentrant {
        require(!cancelled, "TrustLance: already cancelled");

        require(
            freelancer == address(0),
            "TrustLance: freelancer already assigned"
        );

        _cancelProject();
    }

    // =============================================================
    //                       INTERNAL PAYMENT
    // =============================================================

    function _payFreelancer(
        uint256 index,
        Milestone storage milestone
    ) internal {
        uint256 amount = milestone.amount;

        require(amount <= totalEscrowed, "TrustLance: insufficient escrow");

        totalEscrowed -= amount;

        milestone.status = MilestoneStatus.Approved;

        emit MilestoneApproved(index, amount);

        _sendPayment(freelancer, amount);

        milestone.status = MilestoneStatus.Paid;

        emit PaymentReleased(index, freelancer, amount);
    }

    // =============================================================
    //                    INTERNAL REFUND
    // =============================================================

    function _refundMilestoneToClient(
        uint256 index,
        Milestone storage milestone
    ) internal {
        uint256 amount = milestone.amount;

        require(amount <= totalEscrowed, "TrustLance: insufficient escrow");

        totalEscrowed -= amount;

        milestone.status = MilestoneStatus.Refunded;

        emit DisputeResolvedForClient(index, amount);

        _sendPayment(client, amount);

        emit PaymentReleased(index, client, amount);
    }

    // =============================================================
    //                      INTERNAL PAYMENT
    // =============================================================

    function _sendPayment(address recipient, uint256 amount) internal {
        require(recipient != address(0), "TrustLance: invalid recipient");

        (bool success, ) = payable(recipient).call{value: amount}("");

        require(success, "TrustLance: payment failed");
    }

    // =============================================================
    //                    INTERNAL CANCELLATION
    // =============================================================

    function _cancelProject() internal {
        cancelled = true;

        uint256 refund = totalEscrowed;

        totalEscrowed = 0;

        if (refund > 0) {
            _sendPayment(client, refund);
        }

        emit ProjectCancelled(refund);
    }

    // =============================================================
    //                       VIEW FUNCTIONS
    // =============================================================

    /**
     * @notice Number of milestones.
     */
    function getMilestoneCount() external view returns (uint256) {
        return milestones.length;
    }

    /**
     * @notice Returns complete milestone information.
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
            string memory deliverableCID,
            uint256 submittedAt,
            uint256 reviewDeadline,
            uint256 disputeDeadline
        )
    {
        Milestone storage milestone = milestones[index];

        return (
            milestone.description,
            milestone.amount,
            milestone.status,
            milestone.deliverableCID,
            milestone.submittedAt,
            milestone.reviewDeadline,
            milestone.disputeDeadline
        );
    }

    /**
     * @notice Current ETH held by the contract.
     */
    function getEscrowBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
