-- Schema definition for Rubik's Cube Solver Laboratory DB

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Linked to Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Solve Jobs Table
CREATE TABLE IF NOT EXISTS public.solve_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cube_state VARCHAR(54) NOT NULL,
    algorithm TEXT NOT NULL CHECK (algorithm IN ('BFS', 'DFS', 'IDDFS', 'IDA_STAR')),
    heuristic TEXT NOT NULL DEFAULT 'NONE',
    max_depth INTEGER NOT NULL DEFAULT 30,
    timeout_ms INTEGER NOT NULL DEFAULT 30000,
    status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'RUNNING', 'SOLVED', 'TIMEOUT', 'MEMORY_LIMIT', 'INVALID_STATE', 'CANCELLED', 'FAILED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- 3. Solve Results Table
CREATE TABLE IF NOT EXISTS public.solve_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.solve_jobs(id) ON DELETE CASCADE UNIQUE,
    status TEXT NOT NULL,
    solution JSONB NOT NULL DEFAULT '[]'::jsonb,
    nodes_generated BIGINT DEFAULT 0,
    nodes_expanded BIGINT DEFAULT 0,
    nodes_pruned BIGINT DEFAULT 0,
    duplicate_states BIGINT DEFAULT 0,
    max_depth_reached INTEGER DEFAULT 0,
    threshold_iterations INTEGER DEFAULT 0,
    elapsed_ms BIGINT DEFAULT 0,
    peak_memory_bytes BIGINT DEFAULT 0,
    trace_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Benchmarks Table (Aggregated runs)
CREATE TABLE IF NOT EXISTS public.benchmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cube_state VARCHAR(54) NOT NULL,
    test_cases JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED')),
    results JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- 5. Shared Links Table
CREATE TABLE IF NOT EXISTS public.shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.solve_jobs(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Audit Logs Table (Admin viewable)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_solve_jobs_user ON public.solve_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_solve_results_job ON public.solve_results(job_id);
CREATE INDEX IF NOT EXISTS idx_benchmarks_user ON public.benchmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_token ON public.shares(token);

-- Triggers for automatic Profile creation on Auth sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'role', 'user')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
