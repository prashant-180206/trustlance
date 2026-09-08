// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TrustLanceEscrow {
    enum MilestoneStatus {
        Pending,
        Submitted,
        Approved,
        Rejected,
        Disputed,
        Paid
    }

    struct Milestone {
        string description; // short ref; full text lives off-chain
        uint256 amount;
        MilestoneStatus status;
        string deliverableCID;
    }

    address public client;
    address public freelancer; // set on award (FR-CM-5)
    address public disputeResolver; // authorized to call resolveDispute (FR-SC-6)
    Milestone[] public milestones;
    uint256 public totalEscrowed;
    bool public cancelled;

    event ProjectFunded(address indexed client, uint256 amount);
    event FreelancerAwarded(address indexed freelancer);
    event MilestoneSubmitted(uint256 indexed index, string cid);
    event MilestoneApproved(uint256 indexed index, uint256 amount);
    event MilestoneRejected(uint256 indexed index);
    event PaymentReleased(
        uint256 indexed index,
        address indexed to,
        uint256 amount
    );
    event DisputeRaised(uint256 indexed index);
    event DisputeResolved(uint256 indexed index, bool favorFreelancer);
    event ProjectCancelled(uint256 refundedAmount);

    modifier onlyClient() {
        require(msg.sender == client, "not client");
        _;
    }
    modifier onlyFreelancer() {
        require(msg.sender == freelancer, "not freelancer");
        _;
    }
    modifier onlyResolver() {
        require(msg.sender == disputeResolver, "not resolver");
        _;
    } // FR-SC-6

    constructor(address _client, address _disputeResolver) {
        client = _client;
        disputeResolver = _disputeResolver;
    }

    function fundEscrow(
        uint256[] calldata amounts,
        string[] calldata descriptions
    ) external payable onlyClient {
        // FR-CM-4, FR-SC-1: build milestone array and lock funds
    }

    function awardFreelancer(address _freelancer) external onlyClient {
        // FR-CM-5
        freelancer = _freelancer;
        emit FreelancerAwarded(_freelancer);
    }

    function submitMilestone(
        uint256 index,
        string calldata cid
    ) external onlyFreelancer {
        // FR-FM-5, FR-SC-2
    }

    function approveMilestone(uint256 index) external onlyClient {
        // FR-CM-6, FR-CM-7, FR-SC-3: releases payment directly
    }

    function rejectMilestone(uint256 index) external onlyClient {
        // FR-CM-8: sets status to Rejected; dispute is raised separately
    }

    function raiseDispute(uint256 index) external {
        // callable by client or freelancer on a Rejected milestone; sets status Disputed
        require(
            msg.sender == client || msg.sender == freelancer,
            "unauthorized"
        );
        milestones[index].status = MilestoneStatus.Disputed;
        emit DisputeRaised(index);
    }

    function resolveDispute(
        uint256 index,
        bool favorFreelancer
    ) external onlyResolver {
        // FR-DAO-4, FR-SC-3, FR-SC-6: only the DAO resolver relayer may call this
    }

    function cancelProject() external onlyClient {
        // FR-SC-4: refunds unpaid, non-approved milestone balance
    }
}
