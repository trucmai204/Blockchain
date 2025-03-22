export const contractABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "classId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "isPresent",
                "type": "bool"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }
        ],
        "name": "AttendanceMarked",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "classId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "teacher",
                "type": "address"
            }
        ],
        "name": "ClassCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "classId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "student",
                "type": "address"
            }
        ],
        "name": "StudentAdded",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_classId",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "_student",
                "type": "address"
            }
        ],
        "name": "addStudent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "classes",
        "outputs": [
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "address",
                "name": "teacher",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

export const contractAddress = "0xbB6dfDc18B6CfA61DD75028aDb2687FF566BC2B5";