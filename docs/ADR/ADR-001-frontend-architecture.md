# ADR-001: Frontend Architecture

## Context
We need a robust, maintainable frontend to visualize real-time synthetic data and handle complex operator workflows for the IBVAP-SIM dashboard.

## Decision
We will use **React** (via Vite) coupled with **Shadcn UI** and **Tailwind CSS**.

## Alternatives
- Vue.js / Svelte
- Raw HTML/JS
- Heavy visualization frameworks (e.g., Unity/WebGL)

## Reasoning
React provides the deepest ecosystem for real-time state management (TanStack Query, Zustand). Shadcn UI and Tailwind allow for rapid, professional prototyping without the bloat of traditional component libraries, crucial for an SIH-level demo.

## Consequences
- Requires familiarity with modern React hooks.
- Highly decoupled, easy to iterate, and visually premium out of the box.

## Status
Accepted
