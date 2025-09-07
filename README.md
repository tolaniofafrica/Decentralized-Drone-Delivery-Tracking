# 🚀 Decentralized Drone Delivery Tracking

Welcome to a revolutionary Web3 solution for tracking drone deliveries of medical supplies to isolated areas! This project uses the Stacks blockchain and Clarity smart contracts to ensure transparency, immutability, and accountability in the supply chain, preventing loss, tampering, or corruption while enabling real-time verification for all stakeholders.

## ✨ Features
📦 Register and track medical supply inventories securely  
🛫 Create and assign drone delivery requests transparently  
📍 Real-time location tracking via blockchain oracles  
✅ Immutable proof of delivery and receipt verification  
🔒 Escrow-based payments released only upon successful delivery  
📊 Audit trails for regulators and NGOs to monitor operations  
🚫 Dispute resolution for failed or delayed deliveries  
🌍 Support for isolated areas with low-connectivity oracles  

## 🛠 How It Works
This system involves 8 interconnected Clarity smart contracts to handle different aspects of the delivery process, ensuring modularity and security. Here's a high-level overview:

### Smart Contracts Overview
1. **UserRegistry.clar**: Registers participants (suppliers, drone operators, recipients, auditors) with roles and permissions.  
2. **InventoryManager.clar**: Tracks medical supplies, allowing suppliers to add items with hashes for integrity.  
3. **DeliveryRequest.clar**: Enables suppliers to create delivery requests specifying supplies, destinations, and timelines.  
4. **DroneAssignment.clar**: Assigns drones to requests, recording operator details and initial status.  
5. **TrackingOracle.clar**: Integrates with external oracles to log drone GPS positions and status updates immutably.  
6. **DeliveryVerification.clar**: Confirms receipt with signatures from recipients, triggering completion.  
7. **EscrowPayment.clar**: Holds STX or tokens in escrow, releasing funds to operators upon verified delivery.  
8. **AuditDispute.clar**: Logs all events and handles disputes, allowing auditors to review and resolve issues.

**For Suppliers**  
- Register supplies in InventoryManager with a unique hash (e.g., SHA-256 of item details).  
- Call create-delivery in DeliveryRequest, specifying the recipient's address in an isolated area.  
- Funds are locked in EscrowPayment until delivery is verified.  

**For Drone Operators**  
- Register via UserRegistry and get assigned via DroneAssignment.  
- Update flight status through TrackingOracle (using off-chain oracles for GPS data).  
- Upon arrival, request verification in DeliveryVerification.  
- Receive payment from EscrowPayment once confirmed.  

**For Recipients**  
- Verify receipt by signing off in DeliveryVerification, ensuring supplies match the hash.  
- Access transparent tracking via get-delivery-status queries.  

**For Auditors/Regulators**  
- Use AuditDispute to query immutable logs across all contracts.  
- Initiate disputes if anomalies are detected, freezing escrows if needed.  

That's it! This decentralized system solves real-world challenges in humanitarian logistics by providing end-to-end transparency, reducing fraud, and ensuring critical medical supplies reach remote communities reliably. Deploy on Stacks for low-cost, Bitcoin-secured transactions.