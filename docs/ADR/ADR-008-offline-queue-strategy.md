# ADR-008: Offline Queue Strategy

## Context
The simulation must demonstrate what happens to edge data when network connectivity is lost and later restored.

## Decision
The Edge Simulator will utilize a **Local SQLite or In-Memory Queue**, flushing via bulk HTTP POST upon recovery.

## Alternatives
- Heavy distributed brokers (RabbitMQ, Kafka).
- Dropping data (unacceptable).

## Reasoning
Introducing Kafka or RabbitMQ violates the "avoid unnecessary distributed-system complexity" principle for a prototype. The simulation engine running locally can easily buffer JSON payloads in SQLite or a standard Python deque, sending them as a batch payload when the scenario YAML indicates the network is "online".

## Consequences
- Easy to implement and highly observable during the demo.

## Status
Accepted
