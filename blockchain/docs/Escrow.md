# TrustLance Escrow Contract

## Overview

`TrustLanceEscrow` is the smart contract that manages the money and milestones of a freelance project.

The basic idea is:

> The client puts the project money into the smart contract. The freelancer completes work in milestones. The contract releases money according to predefined rules.

There is **no human dispute resolver** in this version.

Instead, the smart contract follows fixed rules for approvals, rejections, disputes, deadlines, and cancellations.

---

# 1. The Main People

There are two main participants:

### Client

The person who creates and funds the project.

The client:

* Funds the escrow.
* Chooses the freelancer.
* Approves milestones.
* Can reject submitted milestones.
* Can withdraw a rejection during a dispute.
* Can request cancellation.
* Receives refunds when the rules require money to go back to the client.

### Freelancer

The person doing the work.

The freelancer:

* Is assigned to the project by the client.
* Submits milestone deliverables.
* Can dispute a rejection.
* Can accept a rejection.
* Can request cancellation.
* Receives milestone payments when the rules say the milestone should be paid.

---

# 2. No Dispute Resolver

The old design had a separate:

```text
disputeResolver
```

account.

That account could decide whether the freelancer or client should receive disputed money.

The new design removes this completely.

There is no special person who can say:

```text
"Freelancer wins"
```

or:

```text
"Client wins"
```

Instead, the smart contract itself follows predetermined rules.

For example:

```text
Client rejects
       ↓
Freelancer disputes
       ↓
Dispute period starts
       ↓
Either party can respond
       ↓
If nobody responds
       ↓
Automatic rule is applied
```

This makes the dispute system deterministic.

---

# 3. Money Flow

The contract uses ETH as the escrowed currency in the current version.

For example:

```text
Client
   │
   │ 10 ETH
   ▼
TrustLanceEscrow
   │
   ├── Milestone 1 → 3 ETH
   ├── Milestone 2 → 4 ETH
   └── Milestone 3 → 3 ETH
```

The ETH stays inside the contract until a rule allows it to leave.

The contract keeps track of:

```text
totalEscrowed
```

This represents the amount of money still locked inside the contract.

When a milestone is paid:

```text
totalEscrowed -= milestone amount
```

When money is refunded:

```text
totalEscrowed -= refund amount
```

---

# 4. Creating the Escrow

The client calls:

```solidity
fundEscrow()
```

The client provides:

* Milestone amounts
* Milestone descriptions
* ETH

For example:

```text
Milestone 1 → 2 ETH → Design
Milestone 2 → 3 ETH → Development
Milestone 3 → 5 ETH → Final delivery
```

The client must send exactly:

```text
2 + 3 + 5 = 10 ETH
```

If the amount is incorrect, the transaction fails.

The contract then stores all milestones.

---

# 5. Funding Can Only Happen Once

The contract contains:

```solidity
bool funded;
```

Once the escrow has been funded:

```text
funded = true
```

The client cannot fund the same escrow again.

This keeps the current project model simple.

---

# 6. Assigning the Freelancer

After funding, the client calls:

```solidity
awardFreelancer()
```

and provides the freelancer's wallet address.

The contract stores:

```text
client
freelancer
```

The freelancer cannot be changed after being assigned.

---

# 7. Milestones

Every project contains one or more milestones.

Each milestone contains:

```text
Description
Amount
Status
Deliverable CID
Submission time
Review deadline
Dispute deadline
```

The contract uses the following statuses:

```text
Pending
Submitted
Approved
Rejected
Disputed
Paid
Refunded
```

---

# 8. Pending

When a project is created, every milestone starts as:

```text
Pending
```

This means:

> The freelancer has not submitted this milestone yet.

Example:

```text
Milestone 1
Status: Pending
Amount: 2 ETH
```

---

# 9. Freelancer Submits Work

The freelancer calls:

```solidity
submitMilestone()
```

The freelancer provides an IPFS CID.

The actual file is stored on IPFS.

The blockchain only stores the CID.

For example:

```text
IPFS file
   ↓
QmXXXXXXXXXXXXXXXX
   ↓
Stored in smart contract
```

The milestone becomes:

```text
Submitted
```

The contract also records:

```text
submittedAt
```

and creates a review deadline.

---

# 10. Client Review Period

When a milestone is submitted, the contract calculates:

```text
reviewDeadline =
    submission time + clientReviewPeriod
```

For example, suppose the project uses:

```text
Client review period = 7 days
```

The freelancer submits on:

```text
September 10
```

The review deadline becomes approximately:

```text
September 17
```

During this period, the client can:

```text
Approve
```

or:

```text
Reject
```

---

# 11. Client Approves

The client calls:

```solidity
approveMilestone()
```

The contract then:

1. Checks that the milestone was submitted.
2. Takes the milestone amount from the escrow.
3. Sends the money to the freelancer.
4. Marks the milestone as paid.

Example:

```text
Milestone amount = 2 ETH

Client approves
      ↓
2 ETH leaves escrow
      ↓
2 ETH → Freelancer
```

The final status becomes:

```text
Paid
```

---

# 12. Client Does Nothing

The client does not have to manually approve forever.

If the client does nothing until the review deadline:

```text
reviewDeadline
      ↓
deadline passes
      ↓
autoApproveMilestone()
```

Anyone can call:

```solidity
autoApproveMilestone()
```

after the deadline.

The contract itself checks whether the deadline has actually passed.

If it has:

```text
Milestone → Paid
ETH → Freelancer
```

This prevents the client from intentionally blocking payment by simply ignoring the project.

---

# 13. Important Point About Automatic Actions

The blockchain does not automatically wake up when a deadline arrives.

For example:

```text
September 17
    ↓
Deadline reached
```

does not automatically execute a Solidity function.

Someone must submit a transaction.

For example:

```text
Frontend
   ↓
Backend/bot
   ↓
autoApproveMilestone()
   ↓
Smart contract checks deadline
   ↓
Payment
```

The important part is that the caller does **not** decide the outcome.

The smart contract checks the rule.

---

# 14. Client Rejects a Milestone

If the client believes the submitted work does not satisfy the agreed requirements, the client can call:

```solidity
rejectMilestone()
```

The milestone becomes:

```text
Rejected
```

No money moves at this point.

The money remains inside the escrow.

Example:

```text
Milestone = 2 ETH

Client rejects
      ↓
Status = Rejected
      ↓
2 ETH remains locked
```

---

# 15. Freelancer Can Dispute

If the freelancer disagrees with the rejection, the freelancer can call:

```solidity
raiseDispute()
```

The milestone becomes:

```text
Disputed
```

The contract starts a dispute period.

For example:

```text
Dispute period = 3 days
```

The contract stores:

```text
disputeDeadline
```

---

# 16. What Happens During a Dispute?

There are three possible outcomes.

### Case 1 — Client Withdraws the Rejection

The client can call:

```solidity
withdrawRejection()
```

This means:

> The client agrees to pay the freelancer after all.

The contract:

```text
Disputed
   ↓
Approved
   ↓
Payment
   ↓
Paid
```

The freelancer receives the milestone amount.

---

# 17. Case 2 — Freelancer Accepts the Rejection

The freelancer can call:

```solidity
acceptRejection()
```

This means:

> The freelancer accepts that the milestone should not be paid.

The contract returns the milestone amount to the client.

The milestone becomes:

```text
Refunded
```

Example:

```text
2 ETH locked

Freelancer accepts rejection
          ↓
2 ETH → Client
```

---

# 18. Case 3 — Nobody Responds

If neither party takes action before the dispute deadline:

```text
disputeDeadline passes
```

the dispute can be automatically resolved using:

```solidity
autoResolveDispute()
```

The current rule is:

> If neither party takes action during the dispute period, the freelancer receives the milestone payment.

Therefore:

```text
Disputed
   ↓
Dispute deadline passes
   ↓
autoResolveDispute()
   ↓
Freelancer gets paid
   ↓
Paid
```

Again, anyone can submit the transaction.

The contract itself checks the deadline.

---

# 19. Why Anyone Can Trigger Automatic Resolution

Functions such as:

```solidity
autoApproveMilestone()
```

and:

```solidity
autoResolveDispute()
```

are intentionally not restricted to the client or freelancer.

This is because their purpose is simply to trigger an already-defined rule.

For example:

```text
Someone calls autoResolveDispute()
             ↓
Contract checks:
"Has the deadline passed?"
             ↓
NO → Transaction fails
             ↓
YES → Contract pays freelancer
```

The caller cannot change the result.

---

# 20. Mutual Project Cancellation

The contract also supports cancellation by mutual agreement.

The client can request cancellation.

The freelancer can also request cancellation.

The contract stores:

```text
clientCancellationRequested
freelancerCancellationRequested
```

For example:

```text
Client requests cancellation
          ↓
clientCancellationRequested = true
```

Then:

```text
Freelancer requests cancellation
          ↓
freelancerCancellationRequested = true
```

Once both are true:

```text
Project cancelled
```

The remaining escrow is returned to the client.

---

# 21. Why the Money Goes Back to the Client

The client originally deposited the project funds into the escrow.

Only the remaining, unpaid money is returned.

Already-paid milestones cannot be refunded by this cancellation mechanism.

For example:

```text
Original escrow = 10 ETH

Milestone 1 paid = 3 ETH

Remaining escrow = 7 ETH
```

If both parties cancel:

```text
7 ETH → Client
```

The freelancer keeps the 3 ETH that was already earned and paid.

---

# 22. Cancellation Before a Freelancer Is Assigned

There is also:

```solidity
cancelProjectBeforeAward()
```

This allows the client to cancel the project before a freelancer has been assigned.

In that situation:

```text
Client
  ↓
Cancel
  ↓
Remaining escrow
  ↓
Client
```

Once a freelancer has been assigned, mutual agreement is required for project cancellation.

---

# 23. Reentrancy Protection

The contract inherits:

```solidity
ReentrancyGuard
```

This protects functions that transfer ETH from certain reentrancy attacks.

Payment-related functions use:

```solidity
nonReentrant
```

before transferring funds.

Examples include:

```text
approveMilestone()
autoApproveMilestone()
withdrawRejection()
acceptRejection()
autoResolveDispute()
cancelProjectBeforeAward()
```

---

# 24. IPFS

The contract does not store the actual project files.

Instead:

```text
Actual file
    ↓
IPFS
    ↓
CID
    ↓
Smart contract
```

For example:

```text
deliverableCID =
"QmXXXXXXXXXXXXXXXX"
```

This keeps large files off-chain.

---

# 25. What the Blockchain Guarantees

The smart contract guarantees things such as:

* Escrowed ETH cannot simply be taken by either party.
* Only the client can fund the project.
* Only the client can assign the freelancer.
* Only the freelancer can submit their milestones.
* Only the client can approve/reject a submitted milestone.
* Deadlines are enforced by the blockchain.
* Dispute outcomes follow predefined rules.
* Payments are performed by the contract.
* Remaining escrow can be refunded according to the cancellation rules.
* No human dispute resolver has special control over the escrow.

---

# 26. What the Blockchain Does NOT Decide

The contract cannot understand the actual quality of the work.

For example, it cannot independently determine:

```text
"Is this website good enough?"
```

or:

```text
"Does this logo match the client's expectations?"
```

or:

```text
"Did the freelancer do a good job?"
```

Those are subjective/off-chain matters.

The contract only enforces the rules that were agreed upon beforehand.

For example:

```text
Submit work
      ↓
Client gets 7 days
      ↓
Approve / Reject
      ↓
If rejected → dispute
      ↓
3-day dispute period
      ↓
Predefined outcome
```

---

# 27. Complete Milestone Flow

The complete normal flow is:

```text
                ┌─────────┐
                │ Pending │
                └────┬────┘
                     │
              Freelancer submits
                     │
                     ▼
               ┌───────────┐
               │ Submitted │
               └─────┬─────┘
                     │
             ┌───────┴────────┐
             │                │
         Approve             Reject
             │                │
             ▼                ▼
           Paid           ┌──────────┐
           │              │ Rejected │
           │              └────┬─────┘
           │                   │
           │              Freelancer
           │               disputes
           │                   │
           │                   ▼
           │              ┌──────────┐
           │              │ Disputed │
           │              └────┬─────┘
           │                   │
           │        ┌──────────┼──────────┐
           │        │          │          │
           │     Client     Freelancer  Timeout
           │    withdraws    accepts       │
           │    rejection   rejection     │
           │        │          │           │
           │        ▼          ▼           ▼
           │       Paid     Refunded      Paid
           │
           └───────────────────────────────
```

---

# 28. Project-Level Flow

The entire project works approximately like this:

```text
Client creates escrow
        │
        ▼
Client deposits ETH
        │
        ▼
Milestones created
        │
        ▼
Client assigns freelancer
        │
        ▼
Freelancer works
        │
        ▼
Freelancer submits milestone
        │
        ▼
Client reviews
        │
        ├───────────────┐
        │               │
     Approve          Reject
        │               │
        ▼               ▼
   Freelancer       Freelancer
      paid            disputes
                        │
                 ┌──────┴──────┐
                 │             │
              Agreement      Timeout
                 │             │
                 ▼             ▼
               Paid       Rule-based result
```

---

# 29. Important Contract Variables

## `client`

The wallet address of the client.

## `freelancer`

The wallet address of the assigned freelancer.

## `totalEscrowed`

The amount of ETH currently locked in the escrow.

## `funded`

Whether the project has been funded.

## `cancelled`

Whether the project has been cancelled.

## `clientReviewPeriod`

How long the client has to review a submitted milestone.

## `disputePeriod`

How long a dispute remains open before the automatic dispute rule can be executed.

## `clientCancellationRequested`

Whether the client has requested cancellation.

## `freelancerCancellationRequested`

Whether the freelancer has requested cancellation.

---

# 30. Important Functions

| Function                     | Who can call it   | Purpose                                         |
| ---------------------------- | ----------------- | ----------------------------------------------- |
| `fundEscrow()`               | Client            | Deposit ETH and create milestones               |
| `awardFreelancer()`          | Client            | Assign freelancer                               |
| `submitMilestone()`          | Freelancer        | Submit work/IPFS CID                            |
| `approveMilestone()`         | Client            | Approve and pay milestone                       |
| `autoApproveMilestone()`     | Anyone            | Pay after review deadline                       |
| `rejectMilestone()`          | Client            | Reject submitted work                           |
| `raiseDispute()`             | Freelancer        | Dispute rejection                               |
| `withdrawRejection()`        | Client            | Accept dispute and pay freelancer               |
| `acceptRejection()`          | Freelancer        | Accept rejection and refund client              |
| `autoResolveDispute()`       | Anyone            | Resolve expired dispute using the protocol rule |
| `requestCancellation()`      | Client/Freelancer | Request mutual cancellation                     |
| `cancelProjectBeforeAward()` | Client            | Cancel before freelancer assignment             |
| `getMilestone()`             | Anyone            | Read milestone information                      |
| `getEscrowBalance()`         | Anyone            | Read contract ETH balance                       |

---

# 31. The Core Idea of TrustLance

The important design principle is:

> **TrustLance does not require the blockchain to decide whether someone's work is good. It uses the blockchain to enforce the financial rules that both parties agreed to.**

The smart contract becomes the neutral execution layer.

Instead of:

```text
"Trust a person to decide the dispute."
```

TrustLance uses:

```text
"Agree to the rules beforehand.
The smart contract enforces those rules."
```

This makes the escrow system predictable and removes the need for a privileged dispute-resolver wallet.
