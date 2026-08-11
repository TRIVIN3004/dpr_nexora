-- -------------------------------------------------------------
-- Nexora DPR Portal — PostgreSQL Aggregation Functions (RPC)
-- Paste and execute this script in your Supabase SQL Editor.
-- -------------------------------------------------------------

-- 1. Dashboard Overview Summary RPC
CREATE OR REPLACE FUNCTION public.get_dashboard_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'totalMembers', (SELECT COUNT(*) FROM public.users WHERE role != 'admin'),
    'activeProjects', (SELECT COUNT(*) FROM public.projects WHERE status != 'Completed'),
    'completedProjectsCount', (SELECT COUNT(*) FROM public.projects WHERE status = 'Completed'),
    'submittedToday', (SELECT COUNT(*) FROM public.reports WHERE date = CURRENT_DATE::text),
    'pendingToday', (SELECT COUNT(*) FROM public.reports WHERE date = CURRENT_DATE::text AND status = 'Pending'),
    'avgProgress', COALESCE((SELECT ROUND(AVG(percentageCompleted)) FROM public.reports), 0)
  ) INTO result;
  RETURN result;
END;
$$;

-- 2. Weekly Hours Log Aggregation RPC
CREATE OR REPLACE FUNCTION public.get_weekly_hours()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', d.day_date::text,
      'totalHours', COALESCE(SUM(r.hoursWorked), 0)
    )
  )
  FROM (
    SELECT (CURRENT_DATE - i)::text as day_date
    FROM generate_series(0, 6) i
  ) d
  LEFT JOIN public.reports r ON r.date = d.day_date
  GROUP BY d.day_date
  ORDER BY d.day_date ASC
  INTO result;
  
  RETURN result;
END;
$$;

-- 3. Project Allocation & Analytics RPC
CREATE OR REPLACE FUNCTION public.get_project_analytics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'projectName', p.name,
      'status', p.status,
      'reportCount', COUNT(r.id),
      'avgProgress', COALESCE(ROUND(AVG(r.percentageCompleted)), 0)
    )
  )
  FROM public.projects p
  LEFT JOIN public.reports r ON r."projectName" = p.name
  GROUP BY p.id, p.name, p.status
  INTO result;
  
  RETURN result;
END;
$$;

-- 4. Employee Productivity Analytics RPC
CREATE OR REPLACE FUNCTION public.get_employee_analytics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'employeeId', u.id,
      'employeeName', u.name,
      'totalHours', COALESCE(SUM(r.hoursWorked), 0),
      'reportCount', COUNT(r.id)
    )
  )
  FROM public.users u
  LEFT JOIN public.reports r ON r."employeeId" = u.id
  WHERE u.role != 'admin'
  GROUP BY u.id, u.name
  INTO result;
  
  RETURN result;
END;
$$;
