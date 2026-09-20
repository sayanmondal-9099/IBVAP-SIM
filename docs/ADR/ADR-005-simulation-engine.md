# ADR-005: Simulation Engine

## Context
We need to generate deterministic, repeatable synthetic scenarios (camera metadata, radar).

## Decision
We will build a custom **Python-based kinematic behavior engine** driven by YAML scenario files and a fixed random seed.

## Alternatives
- Using a 3D game engine (Unity/Unreal) to generate video, then running OpenCV.
- Hardcoded JSON arrays of every coordinate over time.

## Reasoning
Generating raw video and running computer vision models introduces immense overhead and risks breaching the "Simulation-Only" rule by requiring real operational dependencies. A Python mathematical engine generating metadata directly simulates the *output* of an edge processor perfectly, cleanly, and deterministically based on simple YAML configs.

## Consequences
- The prototype focuses entirely on the alerting and triage workflow rather than computer vision accuracy.

## Status
Accepted
