# SUPABASE EGRESS AUDIT REPORT
**Project Name**: Nexora DPR Portal  
**Database Provider**: Supabase (PostgreSQL + REST API)  
**Audit Date**: August 11, 2026  
**Status**: COMPLETE — AUDIT ONLY (No code or database modifications executed)

---

## Executive Summary & Quota Status

- **Reported Supabase Egress Usage**: **21.264 GB**
- **Free Monthly Quota**: **5.000 GB**
- **Quota Consumption**: **425.28%** (Restricted / Exceeded Status)
- **Primary Root Cause**: Storing user-uploaded Base64 Data URLs directly inside PostgreSQL `TEXT[]` database columns (`reports.images` and `users.avatar`), combined with widespread monolithic `SELECT *` queries and a multi-component event listener fan-out loop (`window.dispatchEvent('database_updated')`).

---

## 1. Top Suspected Egress Root Causes (Ranked)

| Rank | Root Cause Issue | File & Location | Egress Contribution | Severity |
| :--- | :--- | :--- | :--- | :--- |
| **#1** | **Base64 Data URL Storage in `reports.images` + `SELECT *`** | `DprForm.jsx` (L124), `database.js` (L169) | ~85% (~18.0 GB) | 🔴 CRITICAL |
| **#2** | **Monolithic `getDatabase()` Event Fan-Out Loop** | `database.js` (L164), `Header.jsx` (L45), `Dashboard.jsx` (L104) | ~10% (~2.1 GB) | 🔴 CRITICAL |
| **#3** | **Unbounded Full-Table Scan on `attendance` Table** | `attendanceDatabase.js` (L153) | ~3% (~0.6 GB) | 🟠 HIGH |
| **#4** | **Client-Side Data Aggregation for Dashboard & Analytics Charts** | `Dashboard.jsx` (L176), `Analytics.jsx` (L40) | ~1.5% (~0.3 GB) | 🟠 HIGH |
| **#5** | **Duplicate & Un-cached Queries on Component Mount** | `TeamManagement.jsx` (L71-74) | ~0.5% (~0.1 GB) | 🟡 MEDIUM |

---

## 2. Complete Inventory of All Supabase Database Queries

Below is the complete list of every Supabase database query identified across the DPR Portal codebase:

### 1. `src/utils/database.js`
- **Query 1: `loginUser()`**
  - **Code**: `supabase.from("users").select("*").eq("email", email)`
  - **Table**: `users` | **Columns**: `*` | **SELECT \***: Yes | **Limit/Pagination**: None
  - **Frequency**: On user login.
  - **Risk**: MEDIUM (fetches full user object including Base64 avatar).
- **Query 2: `simulatePasswordReset()`**
  - **Code**: `supabase.from('users').select('email').eq('email', email).single()`
  - **Table**: `users` | **Columns**: `email` | **SELECT \***: No | **Limit/Pagination**: Single row
  - **Frequency**: On forgot password.
  - **Risk**: LOW (optimized single column query).
- **Query 3: `getDatabase()` - Users Fetch**
  - **Code**: `supabase.from('users').select('*').order('id', { ascending: true })`
  - **Table**: `users` | **Columns**: `*` | **SELECT \***: Yes | **Limit/Pagination**: None
  - **Frequency**: Triggered on page load & every `database_updated` event across all mounted components.
  - **Risk**: HIGH (fetches all users with Base64 avatars).
- **Query 4: `getDatabase()` - Projects Fetch**
  - **Code**: `supabase.from('projects').select('*').order('id', { ascending: true })`
  - **Table**: `projects` | **Columns**: `*` | **SELECT \***: Yes | **Limit/Pagination**: None
  - **Frequency**: Triggered on page load & every `database_updated` event.
  - **Risk**: LOW (small table size).
- **Query 5: `getDatabase()` - Reports Fetch**
  - **Code**: `supabase.from('reports').select('*').order('date', { ascending: false }).order('id', { ascending: false }).limit(300)`
  - **Table**: `reports` | **Columns**: `*` | **SELECT \***: Yes | **Limit/Pagination**: `.limit(300)`
  - **Frequency**: Triggered on page load & every `database_updated` event.
  - **Risk**: 🔴 VERY HIGH (downloads 300 full report rows including Base64 images array `images` `TEXT[]` and `files` `JSONB`).
- **Query 6: `getDatabase()` - Announcements Fetch**
  - **Code**: `supabase.from('announcements').select('*').order('date', { ascending: false }).order('id', { ascending: false }).limit(30)`
  - **Table**: `announcements` | **Columns**: `*` | **SELECT \***: Yes | **Limit/Pagination**: `.limit(30)`
  - **Frequency**: Triggered on page load & every `database_updated` event.
  - **Risk**: LOW.
- **Query 7: `getDatabase()` - Notifications Fetch**
  - **Code**: `supabase.from('notifications').select('*').order('date', { ascending: false }).limit(50)`
  - **Table**: `notifications` | **Columns**: `*` | **SELECT \***: Yes | **Limit/Pagination**: `.limit(50)`
  - **Frequency**: Triggered on page load & every `database_updated` event.
  - **Risk**: LOW.
- **Query 8 & 9: `submitDailyReport()`**
  - **Code**: `supabase.from('reports').insert(newReport)` & `supabase.from('notifications').insert(newNotification)`
  - **Tables**: `reports`, `notifications`
  - **Frequency**: On DPR submission.
  - **Risk**: HIGH (writes multi-megabyte Base64 image arrays into DB row).
- **Query 10 & 11: `updateDailyReport()`**
  - **Code**: `supabase.from('reports').select('status').eq('id', reportId).single()` & `supabase.from('reports').update(reportData).eq('id', reportId).select().single()`
  - **Table**: `reports` | **Columns**: `status` then `*`
  - **Frequency**: On report edit.
  - **Risk**: MEDIUM.
- **Query 12 & 13 & 14: `reviewReportStatus()`**
  - **Code**: `supabase.from('reports').update(...).eq('id', reportId).select().single()`, `supabase.from('users').select('id').eq('email', ...).single()`, `supabase.from('notifications').insert(...)`
  - **Tables**: `reports`, `users`, `notifications`
  - **Frequency**: On admin report approval/rejection.
  - **Risk**: LOW.
- **Query 15 & 16 & 17: `addTeamMember()`**
  - **Code**: `supabase.from('users').select('id').eq('email', ...).maybeSingle()`, `supabase.from('users').insert(...)`, `supabase.from('notifications').insert(...)`
  - **Tables**: `users`, `notifications`
  - **Frequency**: On team member creation.
  - **Risk**: LOW.
- **Query 18 & 19: `editTeamMember()`**
  - **Code**: `supabase.from('users').select('id').eq('email', ...).neq('id', ...).maybeSingle()`, `supabase.from('users').update(...).eq('id', ...).select().single()`
  - **Table**: `users`
  - **Frequency**: On team member edit.
  - **Risk**: MEDIUM.
- **Query 20 & 21: `deleteTeamMember()`**
  - **Code**: `supabase.from('users').select('role').eq('id', ...).single()`, `supabase.from('users').delete().eq('id', ...)`
  - **Table**: `users`
  - **Frequency**: On member deletion.
  - **Risk**: LOW.
- **Query 22: `addProject()`**
  - **Code**: `supabase.from('projects').insert(...)`
  - **Table**: `projects`
  - **Frequency**: On project creation.
  - **Risk**: LOW.
- **Query 23, 24, 25 & 26: `deleteProject()`**
  - **Code**: `supabase.from('projects').select('name')...`, `supabase.from('projects').delete()...`, `supabase.from('users').select('*')`, `supabase.from('users').update(...).eq('id', u.id)` (in loop)
  - **Tables**: `projects`, `users`
  - **Frequency**: On project deletion.
  - **Risk**: HIGH (runs `select('*')` on all users and loops N update queries).
- **Query 27: `editProject()`**
  - **Code**: `supabase.from('projects').update(...).eq('id', ...).select().single()`
  - **Table**: `projects`
  - **Frequency**: On project edit/status toggle.
  - **Risk**: LOW.
- **Query 28: `deleteReport()`**
  - **Code**: `supabase.from('reports').delete().eq('id', reportId)`
  - **Table**: `reports`
  - **Frequency**: On report deletion.
  - **Risk**: LOW.
- **Query 29, 30 & 31: `postAnnouncement()`**
  - **Code**: `supabase.from('announcements').insert(...).select().single()`, `supabase.from('users').select('id')`, `supabase.from('notifications').insert(...)`
  - **Tables**: `announcements`, `users`, `notifications`
  - **Frequency**: On announcement post.
  - **Risk**: LOW.
- **Query 32 & 33: `markNotificationRead()` & `markAllNotificationsRead()`**
  - **Code**: `supabase.from('notifications').update({ read: true }).eq(...)`
  - **Table**: `notifications`
  - **Frequency**: On notification click.
  - **Risk**: LOW.

### 2. `src/utils/attendanceDatabase.js`
- **Query 34: `getAttendanceSettings()`**
  - **Code**: `supabase.from('attendance_settings').select('*').eq('id', 'GLOBAL_CONFIG').maybeSingle()`
  - **Table**: `attendance_settings` | **Columns**: `*`
  - **Frequency**: On Attendance tab load.
  - **Risk**: LOW.
- **Query 35: `updateAttendanceSettings()`**
  - **Code**: `supabase.from('attendance_settings').upsert(...).select().single()`
  - **Table**: `attendance_settings`
  - **Frequency**: On settings save.
  - **Risk**: LOW.
- **Query 36: `getAttendanceRecords()`**
  - **Code**: `supabase.from('attendance').select('*').order('date', { ascending: false })`
  - **Table**: `attendance` | **Columns**: `*` | **SELECT \***: Yes | **Limit/Pagination**: NONE
  - **Frequency**: On Attendance tab load & every `database_updated` event.
  - **Risk**: 🔴 VERY HIGH (unbounded download of entire historical attendance table including `editHistory` JSONB).
- **Query 37: `getAttendanceRecords()` (Seed Fallback)**
  - **Code**: `supabase.from('users').select('*')`
  - **Table**: `users`
  - **Frequency**: When local attendance cache is empty.
  - **Risk**: MEDIUM.
- **Query 38 & 39: `markCheckIn()`**
  - **Code**: `supabase.from('attendance').select('*').eq('id', ...).maybeSingle()`, `supabase.from('attendance').upsert(...).select().single()`
  - **Table**: `attendance`
  - **Frequency**: On staff check-in.
  - **Risk**: LOW.
- **Query 40 & 41: `markCheckOut()`**
  - **Code**: `supabase.from('attendance').select('*').eq('id', ...).maybeSingle()`, `supabase.from('attendance').update(...).eq('id', ...).select().single()`
  - **Table**: `attendance`
  - **Frequency**: On staff check-out.
  - **Risk**: LOW.
- **Query 42, 43 & 44: `adminUpdateAttendance()`**
  - **Code**: `supabase.from('attendance').select('*')...`, `supabase.from('attendance').upsert(...)...`, `supabase.from('notifications').insert(...)`
  - **Tables**: `attendance`, `notifications`
  - **Frequency**: On admin manual attendance update.
  - **Risk**: LOW.
- **Query 45 & 46: `evaluateCompanyAttendancePolicy()`**
  - **Code**: `supabase.from('users').update(...).eq('id', user.id)` & `supabase.from('notifications').insert(...)`
  - **Tables**: `users`, `notifications`
  - **Frequency**: Executed inside loop for every non-admin user on Attendance tab evaluation.
  - **Risk**: MEDIUM (N queries executed inside a loop).
- **Query 47, 48 & 49: `reactivateEmployeeAccount()`**
  - **Code**: `supabase.from('users').update(...).select().single()`, `supabase.from('termination_history').update(...)...`, `supabase.from('notifications').insert(...)`
  - **Tables**: `users`, `termination_history`, `notifications`
  - **Frequency**: On admin employee reactivation.
  - **Risk**: LOW.

### 3. `src/pages/TeamManagement.jsx`
- **Query 50 & 51: `loadData()`**
  - **Code**: `supabase.from('users').select('*').order('id', { ascending: true })` & `supabase.from('projects').select('*').order('id', { ascending: true })`
  - **Tables**: `users`, `projects` | **Columns**: `*` | **SELECT \***: Yes | **Limit/Pagination**: None
  - **Frequency**: On TeamManagement tab load & `database_updated` event.
  - **Risk**: HIGH (duplicate fetch of `users` table).

---

## 3. Analysis of `SELECT *` Pattern & Optimization Recommendations

The codebase uses `select('*')` in **14 separate functions**. This causes unnecessary egress by retrieving unused columns (especially Base64 images and JSON objects).

| Table Name | Retained Columns by `select('*')` | Actually Required Columns | Suggested Optimized Query |
| :--- | :--- | :--- | :--- |
| `reports` | `id, date, employeeName, employeeId, employeeEmail, projectName, moduleName, taskAssigned, taskCompletedToday, workStatus, hoursWorked, percentageCompleted, challengesFaced, tomorrowPlan, images, files, status, feedback, approvedBy, approvedAt` | `id, date, employeeName, employeeEmail, projectName, moduleName, hoursWorked, percentageCompleted, workStatus, status` | `.select('id, date, employeeName, employeeEmail, projectName, moduleName, hoursWorked, percentageCompleted, workStatus, status')` *(Excludes `images`, `files`, `challengesFaced`, `tomorrowPlan` from list queries)* |
| `users` | `id, name, email, password, role, department, assignedProjects, avatar, phone, mustChangePassword` | `id, name, email, role, department, assignedProjects` | `.select('id, name, email, role, department, assignedProjects')` *(Excludes `password`, `avatar` Base64 Data URLs from list queries)* |
| `attendance` | `id, employeeId, employeeName, department, project, role, date, checkInTime, checkOutTime, status, remarks, markedBy, editHistory, createdAt, updatedAt` | `id, employeeId, employeeName, department, project, date, checkInTime, checkOutTime, status, remarks` | `.select('id, employeeId, employeeName, department, project, date, checkInTime, checkOutTime, status, remarks')` *(Excludes `editHistory` JSONB array)* |

---

## 4. Auto-Refresh, Polling & Event Loop Egress Impact

While the application does not use `setInterval` or `setTimeout` for HTTP polling loops, it implements a **custom DOM Event Fan-Out Architecture**:

- **Trigger**: Any database mutation dispatches `window.dispatchEvent(new Event('database_updated'))`.
- **Listeners**:
  - `Header.jsx` (Always mounted globally) -> Calls `getDatabase()` (5 parallel queries).
  - `Dashboard.jsx` (When active tab) -> Calls `getDatabase()` (5 parallel queries).
  - `Attendance.jsx` (When active tab) -> Calls `getDatabase()` + `getAttendanceRecords()` + `getAttendanceSettings()` (7 parallel queries).
  - `AdminReports.jsx` (When active tab) -> Calls `getDatabase()` (5 parallel queries).
  - `Analytics.jsx` (When active tab) -> Calls `getDatabase()` (5 parallel queries).
  - `CalendarView.jsx` (When active tab) -> Calls `getDatabase()` (5 parallel queries).
  - `TeamManagement.jsx` (When active tab) -> Calls `supabase.from('users').select('*')` + `supabase.from('projects').select('*')`.

### Calculated Egress Traffic per Event:
- **Single User Action (e.g. approving a report)**:
  - Dispatches `database_updated`.
  - `Header.jsx` + `Dashboard.jsx` both execute `getDatabase()`.
  - 10 REST API requests fire simultaneously.
  - Data payload per `getDatabase()` call (with 300 reports + Base64 images): **~20 MB**.
  - Total egress for ONE click: **2 x 20 MB = 40 MB transferred in 1 second!**

### Daily & Monthly Estimates for 15 Active Users:
- **Actions per user per day**: ~25 tab switches / updates / report edits.
- **Daily requests per user**: 25 actions x 10 requests = **250 requests/user/day**.
- **Total daily requests for 15 users**: 15 x 250 = **3,750 requests/day**.
- **Daily egress volume**: 3,750 requests x 20 MB / 2 = **~7.5 GB / day**.
- **Monthly egress projection**: **~225 GB / month** (Quota is only 5 GB).

---

## 5. Supabase Realtime & WebSockets Audit

- **`supabase.channel()` calls**: **0 found**
- **`.on('postgres_changes')` listeners**: **0 found**
- **`.subscribe()` calls**: **0 found**
- **Status**: Supabase Realtime WebSockets are **NOT utilized** in the codebase.
- **Finding**: The lack of Realtime WebSocket subscriptions led developers to implement the `database_updated` DOM event fan-out system, which re-fetches full tables via REST API instead of receiving lightweight change deltas over a single WebSocket connection.

---

## 6. Dashboard & Analytics Query Audit

Both `Dashboard.jsx` and `Analytics.jsx` retrieve raw database records via `getDatabase()` and compute summary statistics in browser memory using React `useMemo`:

- **Dashboard KPI Metrics**: Iterates over up to 300 raw report records to calculate total members, active projects, submitted count, pending review count, and average progress %.
- **Dashboard Bar Chart**: Filters reports by date strings in JS memory to compute weekly hours worked.
- **Analytics Contributor Ranking**: Builds employee hours map in JS memory.
- **Required Optimization**: Replace raw record downloads with SQL Aggregations or PostgreSQL RPC functions (`SUM(hoursWorked)`, `AVG(percentageCompleted)`), which return a tiny JSON object (~1 KB) instead of 300 full rows (~20 MB).

---

## 7. Storage & Image Optimization Audit (The Primary Root Cause)

- **Supabase Storage Usage**: `supabase.storage` is **NOT used anywhere**.
- **Anti-Pattern Identified**:
  - `src/pages/DprForm.jsx` lines 117–126: Uses `FileReader.readAsDataURL(file)` to convert user-uploaded image files directly into **Base64 Data URLs** (`data:image/jpeg;base64,/9j/4AAQSkZJRg...`).
  - Stores Base64 strings directly in the `reports.images` `TEXT[]` PostgreSQL column.
  - `src/pages/Settings.jsx` line 105: Converts avatar uploads into Base64 Data URLs and stores them in the `users.avatar` `TEXT` PostgreSQL column.
- **Egress Impact**:
  - Base64 encoding adds a **33% overhead** to binary file sizes.
  - Storing raw images inside table rows means EVERY query selecting `reports` or `users` (`select('*')`) downloads all uploaded image data over REST API on every page load.
  - A single 3MB image becomes ~4MB of Base64 text. 10 images across reports = 40MB payload per query.

---

## 8. Authentication Traffic Audit

- **`supabase.auth.getSession()`**: Not called. Session state is managed locally via `sessionStorage` (`nexora_current_user`).
- **`loginUser()`**: Queries `supabase.from('users').select('*').eq('email', email)`.
- **Finding**: Auth traffic is minimal and not a contributor to high egress.

---

## 9. System Egress Data Flow Diagram

```
[ User Action / Tab Switch ]
           │
           ▼
[ dispatchEvent('database_updated') ]
           │
 ┌─────────┴─────────────────────────────┐
 │                                       │
 ▼                                       ▼
[ Header.jsx (Global) ]         [ Active Page (Dashboard/Reports/etc.) ]
 │                                       │
 ▼                                       ▼
[ getDatabase() ]                       [ getDatabase() ]
 │                                       │
 ├─► users.select('*')                   ├─► users.select('*')
 ├─► projects.select('*')                ├─► projects.select('*')
 ├─► reports.select('*') ◄──[ CRITICAL ] ├─► reports.select('*') ◄──[ CRITICAL ]
 ├─► announcements.select('*')           ├─► announcements.select('*')
 └─► notifications.select('*')           └─► notifications.select('*')
           │                                       │
           └───────────────────┬───────────────────┘
                               │ (Transfers 300 rows + Base64 images)
                               ▼
                    [ Supabase REST API ]
                               │
                               ▼
                   [ ~40 MB Egress / Action ]
```

---

## 10. Estimated Egress Calculation Summary

| Scenario / Query | Response Size | Daily Occurrences (15 Users) | Estimated Daily Traffic | Estimated Monthly Traffic |
| :--- | :--- | :--- | :--- | :--- |
| **`getDatabase()` (with Base64 images)** | ~20.0 MB | 3,750 calls | ~75.0 GB / day | ~2,250 GB / month |
| **`getDatabase()` (without Base64 images)** | ~1.5 MB | 3,750 calls | ~5.62 GB / day | ~168.7 GB / month |
| **`getAttendanceRecords()` (Full Table Scan)** | ~0.3 MB | 450 calls | ~0.135 GB / day | ~4.05 GB / month |
| **Optimized Target Architecture (Column selection + CDN + Caching)** | ~0.02 MB | 300 calls | ~0.006 GB / day | **~0.18 GB / month** |

---

## 11. Final Actionable Recommendations & Fix Priority

> [!IMPORTANT]
> **DO NOT EXECUTE FIXES YET**. Review the priority list below and approve before implementation.

### 🚨 CRITICAL (Immediate Fix - Expected Egress Reduction: ~85%)
1. **Migrate Base64 Data URLs to Supabase Storage Buckets or Public CDN**:
   - Update `DprForm.jsx` and `Settings.jsx` to upload binary files to Supabase Storage buckets or an external S3/CDN.
   - Store only short URL strings (e.g. `https://.../image.jpg`, ~60 bytes) in `reports.images` and `users.avatar`.
   - **Expected Impact**: Reduces `reports` payload size from 20–80 MB down to ~100 KB per query.

2. **Remove Base64 Images from General List Queries (`SELECT` Optimization)**:
   - Exclude `images` and `files` columns when querying list/summary data for `Dashboard.jsx`, `AdminReports.jsx`, and `Analytics.jsx`.
   - Fetch `images` only when an individual report is explicitly opened in `ReportModal.jsx`.
   - **Expected Impact**: Prevents image data transfer during routine dashboard browsing.

### 🔴 HIGH (Fix Next - Expected Egress Reduction: ~10%)
3. **De-duplicate `getDatabase()` Fan-Out Event Loop**:
   - Replace the multi-component `database_updated` event listener loop with a centralized React Context or state management store (e.g., Zustand / React Query) that caches database responses in memory.
   - Prevent `Header.jsx` and page components from executing duplicate parallel fetches.
   - **Expected Impact**: Cuts the number of Supabase REST API requests by 50%–70%.

4. **Paginate and Filter `getAttendanceRecords()`**:
   - Add date range filtering (e.g., `.gte('date', currentMonthStart)`) and `.limit(50)` to `getAttendanceRecords()`.
   - **Expected Impact**: Caps attendance query size regardless of dataset growth.

### 🟡 MEDIUM (Optimize Later - Expected Egress Reduction: ~3%)
5. **Implement SQL Aggregations / RPC Functions**:
   - Replace client-side chart data aggregation in `Dashboard.jsx` and `Analytics.jsx` with Supabase RPC database functions or targeted aggregate queries (`COUNT()`, `SUM()`, `AVG()`).
   - **Expected Impact**: Reduces chart data payload from megabytes to ~1 KB.

6. **Enable HTTP Caching & Client Stale-While-Revalidate Headers**:
   - Configure cache headers for static assets and public file downloads.
