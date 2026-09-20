---
name: ibvap-supabase-schema
description: Database schema and migration rules for IBVAP-SIM using Supabase.
---

# IBVAP-SIM: Supabase Schema Guidelines

## Purpose
Govern future synthetic-data persistence architectures involving PostgreSQL/Supabase. 

**IMPORTANT NOTE:** This skill does NOT imply that Supabase is currently fully configured or active in the repository. Currently, the prototype uses local SQLite. 

## When to use
Use before executing any future database schema changes, adding models, or migrating from SQLite to Supabase.

## Core Rules
1. **Verification First:** Before making any database change:
   - Inspect current project state.
   - Verify the correct Supabase project.
   - Inspect existing schema.
2. **Migration Plan Required:** You must produce a migration plan, explain the impact, and obtain user authorization before migrating.
3. **Synthetic Data Only:** Ensure the database is explicitly designed to handle synthetic, mock data. No real-world PII or operational coordinates.
4. **Schema Design:** Enforce foreign keys (e.g., Incident -> Alert).
5. **Idempotency:** Enforce uniqueness constraints to support idempotent offline syncs (e.g., `unique(object_id, timestamp)`).
6. **Audit Records:** Ensure `AuditLog` tables are strictly append-only.
7. **Identifiers:** Use `simulation_id` and `scenario_id` to partition test runs.
8. **Row-Level Security (RLS):** When applicable in Supabase, define RLS policies strictly.
9. **Secret Handling:** Never expose or hardcode database credentials.
10. **Testing:** Verify and test migrations locally before applying.

## Workflow
1. Read existing models (`src/backend/models.py`).
2. Draft SQL migration.
3. Obtain authorization.
4. Apply and test.

## Repository-Specific Constraints
- The current prototype relies on SQLAlchemy `Base.metadata.create_all()` with SQLite (`ibvap.db`). 
- Do not make production database assumptions.

## Common Mistakes
- **Mistake:** Generating a Supabase migration without checking if the project is actually using PostgreSQL yet.
- **Mistake:** Forgetting to add uniqueness constraints, which breaks the offline sync idempotency.

## Verification Checklist
- [ ] Did you obtain user authorization for the schema change?
- [ ] Are foreign keys correctly mapped?
- [ ] Is the database strictly designated for synthetic data?
