// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "./TrustLanceEscrow.sol";

contract TrustLanceFactory {
    address public immutable disputeResolver;

    mapping(bytes32 => address) public escrowByProject;

    event EscrowCreated(
        bytes32 indexed projectId,
        address indexed client,
        address indexed escrow
    );

    constructor(address _disputeResolver) {
        require(_disputeResolver != address(0), "zero resolver");

        disputeResolver = _disputeResolver;
    }

    function createEscrow(bytes32 projectId)
        external
        returns (address escrow)
    {
        require(projectId != bytes32(0), "zero project id");
        require(
            escrowByProject[projectId] == address(0),
            "escrow already exists"
        );

        escrow = address(
            new TrustLanceEscrow(
                msg.sender,
                disputeResolver
            )
        );

        escrowByProject[projectId] = escrow;

        emit EscrowCreated(
            projectId,
            msg.sender,
            escrow
        );
    }

    function getEscrow(bytes32 projectId)
        external
        view
        returns (address)
    {
        return escrowByProject[projectId];
    }
}