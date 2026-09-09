export const factoryAbi = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_disputeResolver",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "projectId",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "client",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "escrow",
                "type": "address"
            }
        ],
        "name": "EscrowCreated",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "projectId",
                "type": "bytes32"
            }
        ],
        "name": "createEscrow",
        "outputs": [
            {
                "internalType": "address",
                "name": "escrow",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "disputeResolver",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "name": "escrowByProject",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "projectId",
                "type": "bytes32"
            }
        ],
        "name": "getEscrow",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]