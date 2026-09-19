// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "./TrustLanceEscrow.sol";

contract TrustLanceFactory {
    // =============================================================
    //                            STATE
    // =============================================================

    /**
     * @dev Client review period used by every escrow created
     *      by this factory.
     *
     * Example:
     * 7 days = 7 * 24 * 60 * 60
     */
    uint256 public immutable clientReviewPeriod;

    /**
     * @dev Dispute period used by every escrow created
     *      by this factory.
     */
    uint256 public immutable disputePeriod;

    /**
     * @dev All escrow contracts created by this factory.
     */
    address[] private allEscrows;

    /**
     * @dev Escrows created by each client.
     */
    mapping(address => address[]) private clientEscrows;

    /**
     * @dev Allows the factory/frontend/indexer to verify whether
     *      an address was created by this factory.
     */
    mapping(address => bool) public isEscrow;

    // =============================================================
    //                            EVENTS
    // =============================================================

    event EscrowCreated(
        address indexed escrow,
        address indexed client,
        uint256 escrowIndex
    );

    // =============================================================
    //                         CONSTRUCTOR
    // =============================================================

    constructor(
        uint256 _clientReviewPeriod,
        uint256 _disputePeriod
    ) {
        require(
            _clientReviewPeriod > 0,
            "Factory: invalid review period"
        );

        require(
            _disputePeriod > 0,
            "Factory: invalid dispute period"
        );

        clientReviewPeriod = _clientReviewPeriod;
        disputePeriod = _disputePeriod;
    }

    // =============================================================
    //                       CREATE ESCROW
    // =============================================================

    /**
     * @notice Creates a new escrow for msg.sender.
     *
     * @dev msg.sender automatically becomes the client.
     *
     * The factory does NOT hold any ETH.
     * The newly created TrustLanceEscrow owns its own funds.
     */
    function createEscrow()
        external
        returns (address escrowAddress)
    {
        TrustLanceEscrow escrow = new TrustLanceEscrow(
            msg.sender,
            clientReviewPeriod,
            disputePeriod
        );

        escrowAddress = address(escrow);

        uint256 escrowIndex = allEscrows.length;

        allEscrows.push(escrowAddress);
        clientEscrows[msg.sender].push(escrowAddress);

        isEscrow[escrowAddress] = true;

        emit EscrowCreated(
            escrowAddress,
            msg.sender,
            escrowIndex
        );
    }

    // =============================================================
    //                           GETTERS
    // =============================================================

    /**
     * @notice Returns the total number of escrows created.
     */
    function getEscrowCount()
        external
        view
        returns (uint256)
    {
        return allEscrows.length;
    }

    /**
     * @notice Returns an escrow address by global index.
     */
    function getEscrow(uint256 index)
        external
        view
        returns (address)
    {
        require(
            index < allEscrows.length,
            "Factory: invalid index"
        );

        return allEscrows[index];
    }

    /**
     * @notice Returns all escrow addresses.
     */
    function getAllEscrows()
        external
        view
        returns (address[] memory)
    {
        return allEscrows;
    }

    /**
     * @notice Returns all escrows created by a particular client.
     */
    function getClientEscrows(address client)
        external
        view
        returns (address[] memory)
    {
        return clientEscrows[client];
    }

    /**
     * @notice Returns the number of escrows created by a client.
     */
    function getClientEscrowCount(address client)
        external
        view
        returns (uint256)
    {
        return clientEscrows[client].length;
    }

    /**
     * @notice Returns an individual escrow belonging to a client.
     */
    function getClientEscrow(
        address client,
        uint256 index
    )
        external
        view
        returns (address)
    {
        require(
            index < clientEscrows[client].length,
            "Factory: invalid client index"
        );

        return clientEscrows[client][index];
    }
}