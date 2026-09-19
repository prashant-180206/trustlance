# TrustLance Factory

## Overview

`TrustLanceFactory` is the contract responsible for creating and tracking individual `TrustLanceEscrow` contracts.

Instead of deploying an escrow contract manually for every freelance project, the application interacts with the factory. The factory creates a new escrow contract and records its address.

The factory **does not manage project funds, milestones, payments, disputes, or cancellations**. Those responsibilities belong to the individual `TrustLanceEscrow` contract.

The architecture is:

```text
                    TrustLanceFactory
                           |
             +-------------+-------------+
             |             |             |
             v             v             v
        TrustLanceEscrow TrustLanceEscrow TrustLanceEscrow
           Project A        Project B        Project C
```

Each project therefore has its own independent escrow contract.

---

## Responsibilities

The factory has four main responsibilities:

1. Configure the rules used by newly created escrows.
2. Deploy new `TrustLanceEscrow` contracts.
3. Maintain a registry of all escrows it created.
4. Provide lookup functions for clients and applications.

It intentionally does **not** handle escrow funds.

---

# Configuration

The factory receives two parameters when it is deployed:

```solidity
constructor(
    uint256 _clientReviewPeriod,
    uint256 _disputePeriod
)
```

These values are stored as immutable variables:

```solidity
uint256 public immutable clientReviewPeriod;
uint256 public immutable disputePeriod;
```

### Client Review Period

The amount of time the client has to respond to a submitted milestone before the automatic approval rule can take effect.

For example:

```text
7 days
```

### Dispute Period

The amount of time used by the escrow's rule-based dispute mechanism.

For example:

```text
3 days
```

Both values must be greater than zero.

```solidity
require(
    _clientReviewPeriod > 0,
    "Factory: invalid review period"
);

require(
    _disputePeriod > 0,
    "Factory: invalid dispute period"
);
```

---

# Why the Periods Are Factory-Wide

The factory applies the same configuration to every escrow it creates.

For example:

```text
Factory
│
├── Client Review Period: 7 days
└── Dispute Period: 3 days
```

Every escrow created by this factory receives:

```text
7-day review period
3-day dispute period
```

The `createEscrow()` function therefore does not allow the caller to choose arbitrary periods.

This prevents different clients from creating projects with inconsistent platform rules.

If the platform later needs different rules, a new factory can be deployed with the new configuration.

Existing escrows remain governed by the configuration they were created with.

---

# Creating an Escrow

The main factory function is:

```solidity
function createEscrow()
    external
    returns (address escrowAddress)
```

The caller automatically becomes the client of the newly created escrow.

Internally, the factory performs:

```solidity
TrustLanceEscrow escrow = new TrustLanceEscrow(
    msg.sender,
    clientReviewPeriod,
    disputePeriod
);
```

Therefore:

```text
User
 │
 │ createEscrow()
 ▼
TrustLanceFactory
 │
 │ new TrustLanceEscrow(...)
 ▼
New TrustLanceEscrow
```

The newly created escrow is then registered by the factory.

---

# Escrow Registry

The factory maintains a global list:

```solidity
address[] private allEscrows;
```

Every newly created escrow is added to this list.

The factory also maintains a per-client registry:

```solidity
mapping(address => address[]) private clientEscrows;
```

This allows the system to answer questions such as:

```text
How many escrows exist?
Which escrow is #5?
Which escrows were created by this client?
```

---

# Escrow Verification

The factory maintains:

```solidity
mapping(address => bool) public isEscrow;
```

When an escrow is created:

```solidity
isEscrow[escrowAddress] = true;
```

This allows applications and other contracts to verify whether an address was created by this factory.

For example:

```solidity
factory.isEscrow(escrowAddress)
```

returns:

```text
true
```

for an escrow created by the factory.

---

# Events

Every successful escrow creation emits:

```solidity
event EscrowCreated(
    address indexed escrow,
    address indexed client,
    uint256 escrowIndex
);
```

The event contains:

* `escrow` — address of the newly created escrow.
* `client` — address that created the escrow.
* `escrowIndex` — position of the escrow in the global registry.

Example:

```text
EscrowCreated(
    0xABC...,
    0x123...,
    0
)
```

The event is particularly useful for off-chain indexing.

The TrustLance backend can listen for `EscrowCreated` events and create the corresponding project/escrow record in Supabase.

---

# Getter Functions

## `getEscrowCount()`

Returns the total number of escrows created by the factory.

```solidity
function getEscrowCount()
    external
    view
    returns (uint256)
```

Example:

```text
Factory
├── Escrow #0
├── Escrow #1
├── Escrow #2
└── Escrow #3

getEscrowCount() → 4
```

---

## `getEscrow()`

Returns an escrow using its global index.

```solidity
function getEscrow(uint256 index)
    external
    view
    returns (address)
```

Example:

```solidity
getEscrow(0)
```

returns the first escrow created by the factory.

An invalid index reverts.

---

## `getAllEscrows()`

Returns all escrow addresses:

```solidity
function getAllEscrows()
    external
    view
    returns (address[] memory)
```

Example:

```text
[
    0xAAA...,
    0xBBB...,
    0xCCC...
]
```

This is useful for applications that need to retrieve the complete factory registry.

---

## `getClientEscrows()`

Returns all escrows created by a particular client:

```solidity
function getClientEscrows(address client)
    external
    view
    returns (address[] memory)
```

For example:

```text
Client A
├── Escrow #0
├── Escrow #3
└── Escrow #7
```

The function returns the addresses of those three escrows.

---

## `getClientEscrowCount()`

Returns how many escrows a client has created:

```solidity
function getClientEscrowCount(address client)
    external
    view
    returns (uint256)
```

---

## `getClientEscrow()`

Returns a specific escrow from a client's escrow list:

```solidity
function getClientEscrow(
    address client,
    uint256 index
)
    external
    view
    returns (address)
```

An invalid client-specific index reverts.

---

# Money Flow

The factory does **not** receive or hold project funds.

The flow is:

```text
Client
  │
  │ createEscrow()
  ▼
Factory
  │
  │ deploys
  ▼
TrustLanceEscrow
  │
  │ fundEscrow()
  ▼
Escrow Contract
  │
  └── holds project ETH
```

After creation, all financial operations happen directly through the individual escrow contract.

The factory is therefore not an intermediary for payments.

---

# Separation of Responsibilities

## Factory

The factory handles:

```text
Deployment
Registration
Indexing
Lookup
Escrow verification
```

## TrustLanceEscrow

The escrow handles:

```text
Funding
Freelancer assignment
Milestones
Deliverables
Client approval
Automatic approval
Disputes
Rule-based dispute resolution
Payments
Refunds
Cancellation
```

This separation keeps the factory simple and prevents it from becoming a central point for project-specific logic.

---

# Example Lifecycle

Suppose a client wants to create a new freelance project.

### 1. Client creates an escrow

```text
Client
  │
  ▼
Factory.createEscrow()
```

### 2. Factory deploys a new escrow

```text
Factory
  │
  ▼
TrustLanceEscrow #12
```

### 3. Factory registers it

```text
allEscrows
    │
    └── #12 → 0xABC...
```

and:

```text
clientEscrows[client]
    │
    └── 0xABC...
```

### 4. Factory emits the event

```text
EscrowCreated
```

### 5. Application records the project

The blockchain event can be indexed by the backend and associated with the corresponding project in Supabase.

### 6. Client interacts directly with the escrow

```text
fundEscrow()
awardFreelancer()
```

and later:

```text
submitMilestone()
approveMilestone()
```

The factory is no longer involved in these operations.

---

# Security Model

The factory does not have custody of escrow funds.

A compromised or malfunctioning factory therefore does not directly control the ETH held by existing escrow contracts.

Each escrow has its own state and financial balance.

The factory's main security responsibilities are therefore:

* Correct escrow deployment.
* Correct constructor parameters.
* Correct registry bookkeeping.
* Correct event emission.

The financial security logic remains inside `TrustLanceEscrow`.

---

# Testing Requirements

The factory test suite should focus only on its own responsibilities.

Required tests include:

### Deployment

* Stores the client review period.
* Stores the dispute period.
* Rejects a zero review period.
* Rejects a zero dispute period.

### Escrow Creation

* Creates an escrow.
* Uses the caller as the client.
* Registers the escrow globally.
* Registers the escrow under the client.
* Marks the address using `isEscrow`.
* Emits `EscrowCreated` with the correct index.

### Multiple Escrows

* Multiple escrows receive different addresses.
* Escrows from different clients are tracked independently.

### Getters

* Valid global indexes return the correct escrow.
* Invalid global indexes revert.
* Valid client indexes return the correct escrow.
* Invalid client indexes revert.

The factory should **not** duplicate tests for milestone payments, disputes, refunds, or other escrow functionality. Those behaviors belong to the `TrustLanceEscrow` test suite.

---

# Summary

`TrustLanceFactory` is the deployment and registry layer of TrustLance.

Its responsibility can be summarized as:

```text
                 TrustLanceFactory
                        │
            ┌───────────┴───────────┐
            │                       │
       Create escrow            Track escrow
            │                       │
            ▼                       ▼
    TrustLanceEscrow          Registry / Events
            │
            ▼
       Project Logic
            │
    ┌───────┼────────┐
    │       │        │
 Funding  Milestones Disputes
    │       │        │
    └───────┼────────┘
            │
          Payments
```

The key design principle is:

> **The factory creates and tracks escrows; each escrow independently manages its own project and funds.**
