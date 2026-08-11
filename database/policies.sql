-- RLS Policy Definitions for Rubik's Cube Solver Laboratory DB

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solve_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solve_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY select_profiles ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY update_own_profile ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. Solve Jobs Policies
CREATE POLICY select_own_jobs ON public.solve_jobs
    FOR SELECT USING (
        auth.uid() = user_id 
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY insert_own_jobs ON public.solve_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY update_own_jobs ON public.solve_jobs
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 3. Solve Results Policies (Viewable by owner, admin, or via an active shared link)
CREATE POLICY select_results ON public.solve_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.solve_jobs 
            WHERE solve_jobs.id = job_id 
              AND (solve_jobs.user_id = auth.uid() 
                   OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
        )
        OR EXISTS (
            SELECT 1 FROM public.shares 
            WHERE shares.job_id = job_id 
              AND (shares.expires_at IS NULL OR shares.expires_at > NOW())
        )
    );

CREATE POLICY insert_results ON public.solve_results
    FOR INSERT WITH CHECK (true); -- Allowed for background service role insertions

-- 4. Benchmarks Policies
CREATE POLICY select_own_benchmarks ON public.benchmarks
    FOR SELECT USING (
        auth.uid() = user_id 
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY insert_own_benchmarks ON public.benchmarks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Shared Links Policies
CREATE POLICY select_all_shares ON public.shares
    FOR SELECT USING (true);

CREATE POLICY insert_own_shares ON public.shares
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY delete_own_shares ON public.shares
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Audit Logs Policies (Admins only)
CREATE POLICY admin_audit_logs ON public.audit_logs
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
