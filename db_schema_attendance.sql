-- -------------------------------------------------------------
-- Nexora DPR Portal - Attendance Management Schema (Non-destructive)
-- Safe to execute in Supabase SQL Editor: Will NOT drop existing tables.
-- -------------------------------------------------------------

-- 1. Create ATTENDANCE table
CREATE TABLE IF NOT EXISTS public.attendance (
  id TEXT PRIMARY KEY,
  "employeeId" TEXT NOT NULL,
  "employeeName" TEXT NOT NULL,
  department TEXT,
  project TEXT,
  role TEXT DEFAULT 'member',
  date TEXT NOT NULL,
  "checkInTime" TEXT,
  "checkOutTime" TEXT,
  status TEXT NOT NULL DEFAULT 'Present', -- Present, Absent, Late, Half Day, Leave
  remarks TEXT DEFAULT '',
  "markedBy" TEXT DEFAULT 'Self', -- Self, Admin, QR, Face
  "editHistory" JSONB DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create ATTENDANCE_SETTINGS table
CREATE TABLE IF NOT EXISTS public.attendance_settings (
  id TEXT PRIMARY KEY DEFAULT 'GLOBAL_CONFIG',
  "officeStartTime" TEXT DEFAULT '09:00',
  "officeEndTime" TEXT DEFAULT '17:00',
  "lateEntryTime" TEXT DEFAULT '09:15',
  "workingDays" TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  "minimumAttendancePct" INTEGER DEFAULT 75,
  "warningPercentage" INTEGER DEFAULT 50,
  "terminationPercentage" INTEGER DEFAULT 50,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create ATTENDANCE_WARNINGS table
CREATE TABLE IF NOT EXISTS public.attendance_warnings (
  id TEXT PRIMARY KEY,
  "employeeId" TEXT NOT NULL,
  "employeeName" TEXT NOT NULL,
  "employeeEmail" TEXT NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,
  "warningType" TEXT DEFAULT 'Below 75%',
  message TEXT NOT NULL,
  "issuedAt" TEXT NOT NULL,
  status TEXT DEFAULT 'Active' -- Active, Acknowledged, Resolved
);

-- 4. Create TERMINATION_HISTORY table
CREATE TABLE IF NOT EXISTS public.termination_history (
  id TEXT PRIMARY KEY,
  "employeeId" TEXT NOT NULL,
  "employeeName" TEXT NOT NULL,
  "employeeEmail" TEXT NOT NULL,
  "attendancePercentage" NUMERIC(5,2) NOT NULL,
  reason TEXT NOT NULL DEFAULT 'Attendance Below Company Policy',
  "terminatedAt" TEXT NOT NULL,
  "terminatedBy" TEXT DEFAULT 'System Automated Policy',
  status TEXT DEFAULT 'Terminated', -- Terminated, Reactivated
  "reactivatedAt" TEXT,
  "reactivatedBy" TEXT
);

-- 5. Create ATTENDANCE_REPORTS table
CREATE TABLE IF NOT EXISTS public.attendance_reports (
  id TEXT PRIMARY KEY,
  "reportType" TEXT NOT NULL, -- Daily, Weekly, Monthly, Employee, Project
  filters JSONB DEFAULT '{}'::jsonb,
  "generatedAt" TEXT NOT NULL,
  "generatedBy" TEXT NOT NULL
);

-- Enable RLS for all new tables
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.termination_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_reports ENABLE ROW LEVEL SECURITY;

-- Permissive Client-Side Access Policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all operations for attendance') THEN
    CREATE POLICY "Enable all operations for attendance" ON public.attendance FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all operations for attendance_settings') THEN
    CREATE POLICY "Enable all operations for attendance_settings" ON public.attendance_settings FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all operations for attendance_warnings') THEN
    CREATE POLICY "Enable all operations for attendance_warnings" ON public.attendance_warnings FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all operations for termination_history') THEN
    CREATE POLICY "Enable all operations for termination_history" ON public.termination_history FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all operations for attendance_reports') THEN
    CREATE POLICY "Enable all operations for attendance_reports" ON public.attendance_reports FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Insert default settings row if missing
INSERT INTO public.attendance_settings (id, "officeStartTime", "officeEndTime", "lateEntryTime", "workingDays", "minimumAttendancePct", "warningPercentage", "terminationPercentage")
VALUES ('GLOBAL_CONFIG', '09:00', '17:00', '09:15', ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], 75, 50, 50)
ON CONFLICT (id) DO NOTHING;
