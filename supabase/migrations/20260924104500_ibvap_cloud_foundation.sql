-- ============================================================================
-- IBVAP-SIM / KAAL — Cloud PostgreSQL Foundation Migration
-- Migration: 20260924104500_ibvap_cloud_foundation.sql
-- Description: Core tables, constraints, RLS policies, and SHA-256 audit trigger
-- Target: Supabase PostgreSQL 15+
-- Safety: SIMULATION ONLY — Strict synthetic data boundaries
-- ============================================================================

-- Ensure pgcrypto extension is available for SHA-256 cryptographic digest calculation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. ALERTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id VARCHAR(64),
    scenario_id VARCHAR(64),
    sensor_id VARCHAR(64),
    site_id VARCHAR(64),
    object_id VARCHAR(64) NOT NULL,
    object_type VARCHAR(64),
    alert_type VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'new' 
        CHECK (status IN ('new', 'unacknowledged', 'acknowledged', 'escalated', 'dismissed')),
    priority_score NUMERIC(5, 1) NOT NULL DEFAULT 0.0 
        CHECK (priority_score >= 0.0 AND priority_score <= 100.0),
    priority_band VARCHAR(4) NOT NULL DEFAULT 'P4' 
        CHECK (priority_band IN ('P1', 'P2', 'P3', 'P4')),
    reason_code VARCHAR(64),
    confidence FLOAT NOT NULL DEFAULT 1.0 
        CHECK (confidence >= 0.0 AND confidence <= 1.0),
    quality FLOAT NOT NULL DEFAULT 1.0 
        CHECK (quality >= 0.0 AND quality <= 1.0),
    persistence_time FLOAT NOT NULL DEFAULT 0.0 
        CHECK (persistence_time >= 0.0),
    corroboration_count INT NOT NULL DEFAULT 0 
        CHECK (corroboration_count >= 0),
    review_decision VARCHAR(64),
    review_notes TEXT,
    reviewer_id VARCHAR(64),
    is_synthetic BOOLEAN NOT NULL DEFAULT true 
        CHECK (is_synthetic = true),
    simulated_time FLOAT,
    receipt_time TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_alerts_priority ON public.alerts (priority_band, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_object_id ON public.alerts (object_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts (status);
CREATE INDEX IF NOT EXISTS idx_alerts_simulation_id ON public.alerts (simulation_id);

-- ----------------------------------------------------------------------------
-- 2. INCIDENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id VARCHAR(64),
    alert_id UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'open' 
        CHECK (status IN ('open', 'under_review', 'resolved', 'unresolved', 'transferred', 'closed')),
    resolution VARCHAR(64),
    resolution_notes TEXT,
    reviewer_id VARCHAR(64),
    is_synthetic BOOLEAN NOT NULL DEFAULT true 
        CHECK (is_synthetic = true),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_incidents_alert_id ON public.incidents (alert_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents (status);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON public.incidents (created_at DESC);

-- ----------------------------------------------------------------------------
-- 3. MOCK TRANSFERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mock_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    simulated_receiver VARCHAR(64) NOT NULL DEFAULT 'mock_army_base_hq',
    request_id VARCHAR(64),
    simulation_id VARCHAR(64),
    acknowledgement_status VARCHAR(32) NOT NULL DEFAULT 'accepted',
    is_synthetic BOOLEAN NOT NULL DEFAULT true 
        CHECK (is_synthetic = true),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mock_transfers_incident_id ON public.mock_transfers (incident_id);
CREATE INDEX IF NOT EXISTS idx_mock_transfers_timestamp ON public.mock_transfers (timestamp DESC);

-- ----------------------------------------------------------------------------
-- 4. AUDIT LOGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_num BIGSERIAL UNIQUE NOT NULL,
    simulation_id VARCHAR(64),
    actor VARCHAR(64) NOT NULL DEFAULT 'system',
    action VARCHAR(64) NOT NULL,
    resource VARCHAR(128) NOT NULL,
    outcome VARCHAR(64) NOT NULL DEFAULT 'success',
    reason TEXT,
    request_id VARCHAR(64),
    previous_hash VARCHAR(64),
    current_hash VARCHAR(64) NOT NULL,
    is_synthetic BOOLEAN NOT NULL DEFAULT true 
        CHECK (is_synthetic = true),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_seq ON public.audit_logs (sequence_num ASC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_sim ON public.audit_logs (simulation_id);

-- ----------------------------------------------------------------------------
-- 5. UPDATED_AT TRIGGER FUNCTION
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = clock_timestamp();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_alerts_updated_at ON public.alerts;
CREATE TRIGGER trg_alerts_updated_at
BEFORE UPDATE ON public.alerts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_incidents_updated_at ON public.incidents;
CREATE TRIGGER trg_incidents_updated_at
BEFORE UPDATE ON public.incidents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. AUDIT CHAIN INTEGRITY & SERIALIZATION TRIGGER
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_audit_log_entry()
RETURNS TRIGGER AS $$
DECLARE
    last_record RECORD;
    prev_h VARCHAR(64);
    calc_data TEXT;
BEGIN
    -- Enforce simulation boundary
    IF NEW.is_synthetic IS NOT TRUE THEN
        RAISE EXCEPTION 'Non-synthetic audit records are prohibited by constitution.';
    END IF;

    -- Concurrently lock the most recent audit record to prevent chain forks
    SELECT current_hash INTO prev_h
    FROM public.audit_logs
    ORDER BY sequence_num DESC
    LIMIT 1
    FOR UPDATE;

    NEW.previous_hash := COALESCE(prev_h, 'GENESIS');
    NEW.timestamp := COALESCE(NEW.timestamp, clock_timestamp());

    -- Canonical SHA-256 Chained Hash Formula from audit_service.py:
    -- data = f"{action}|{resource}|{outcome}|{timestamp_str}|{previous_hash or 'GENESIS'}"
    calc_data := NEW.action || '|' || NEW.resource || '|' || NEW.outcome || '|' || 
                 to_char(NEW.timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US') || '|' || 
                 NEW.previous_hash;

    NEW.current_hash := encode(digest(calc_data, 'sha256'), 'hex');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_chain_insert ON public.audit_logs;
CREATE TRIGGER trg_audit_chain_insert
BEFORE INSERT ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log_entry();

-- ----------------------------------------------------------------------------
-- 7. AUDIT IMMUTABILITY TRIGGER (BLOCK UPDATE & DELETE)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit records are cryptographically chained and strictly immutable. UPDATE and DELETE operations are forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_immutable ON public.audit_logs;
CREATE TRIGGER trg_audit_immutable
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_tampering();

-- ----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- Enable RLS on all core tables
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ALERTS Policies
DROP POLICY IF EXISTS "alerts_read_policy" ON public.alerts;
CREATE POLICY "alerts_read_policy" ON public.alerts
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "alerts_insert_policy" ON public.alerts;
CREATE POLICY "alerts_insert_policy" ON public.alerts
    FOR INSERT TO anon, authenticated
    WITH CHECK (is_synthetic = true);

DROP POLICY IF EXISTS "alerts_update_policy" ON public.alerts;
CREATE POLICY "alerts_update_policy" ON public.alerts
    FOR UPDATE TO anon, authenticated
    USING (is_synthetic = true)
    WITH CHECK (is_synthetic = true);

-- INCIDENTS Policies
DROP POLICY IF EXISTS "incidents_read_policy" ON public.incidents;
CREATE POLICY "incidents_read_policy" ON public.incidents
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "incidents_insert_policy" ON public.incidents;
CREATE POLICY "incidents_insert_policy" ON public.incidents
    FOR INSERT TO anon, authenticated
    WITH CHECK (is_synthetic = true);

DROP POLICY IF EXISTS "incidents_update_policy" ON public.incidents;
CREATE POLICY "incidents_update_policy" ON public.incidents
    FOR UPDATE TO anon, authenticated
    USING (is_synthetic = true)
    WITH CHECK (is_synthetic = true);

-- MOCK TRANSFERS Policies
DROP POLICY IF EXISTS "mock_transfers_read_policy" ON public.mock_transfers;
CREATE POLICY "mock_transfers_read_policy" ON public.mock_transfers
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "mock_transfers_insert_policy" ON public.mock_transfers;
CREATE POLICY "mock_transfers_insert_policy" ON public.mock_transfers
    FOR INSERT TO anon, authenticated
    WITH CHECK (is_synthetic = true);

-- AUDIT LOGS Policies
DROP POLICY IF EXISTS "audit_logs_read_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_read_policy" ON public.audit_logs
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
    FOR INSERT TO anon, authenticated
    WITH CHECK (is_synthetic = true);

-- Note: No UPDATE or DELETE policies exist for audit_logs, and the trigger explicitly raises an exception.
