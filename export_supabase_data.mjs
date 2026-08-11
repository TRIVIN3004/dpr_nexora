/**
 * Nexora DPR — Supabase Full Data Exporter
 * ==========================================
 * Exports all tables to JSON files in ./supabase_backup/
 * Run with: node export_supabase_data.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://qwvdyyeyzpqtxqzithso.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BpSLx7DlTk4I5weA9fK1Yg_JSvA8tWa';

// All tables to export (in dependency order)
const TABLES = [
  { name: 'users',               select: '*',  orderBy: 'id' },
  { name: 'projects',            select: '*',  orderBy: 'id' },
  { name: 'reports',             select: '*',  orderBy: 'date' },
  { name: 'announcements',       select: '*',  orderBy: 'date' },
  { name: 'notifications',       select: '*',  orderBy: 'date' },
  { name: 'attendance',          select: '*',  orderBy: 'date' },
  { name: 'attendance_settings', select: '*',  orderBy: null  },
  { name: 'termination_history', select: '*',  orderBy: null  },
];

// ── Setup ─────────────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = join(__dirname, 'supabase_backup');
const TIMESTAMP  = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Helpers ───────────────────────────────────────────────────────────────────
const log  = (msg)         => console.log(`  ✅ ${msg}`);
const warn = (msg)         => console.warn(`  ⚠️  ${msg}`);
const err  = (msg, e)      => console.error(`  ❌ ${msg}`, e?.message || e);
const pad  = (n, w = 6)    => String(n).padStart(w, ' ');

/** Fetch ALL rows from a table using pagination (1000 rows per page) */
async function fetchAllRows(tableName, select = '*', orderBy = null) {
  const PAGE_SIZE = 1000;
  let allRows = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from(tableName)
      .select(select)
      .range(from, from + PAGE_SIZE - 1);

    if (orderBy) {
      query = query.order(orderBy, { ascending: true });
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Supabase error on table "${tableName}": ${error.message}`);
    }

    if (!data || data.length === 0) break;

    allRows = allRows.concat(data);
    console.log(`      page ${Math.floor(from / PAGE_SIZE) + 1}: fetched ${pad(data.length)} rows (total: ${pad(allRows.length)})`);

    if (data.length < PAGE_SIZE) break; // Last page
    from += PAGE_SIZE;
  }

  return allRows;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║      Nexora DPR — Supabase Data Exporter        ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`\n  Project : ${SUPABASE_URL}`);
  console.log(`  Time    : ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
  console.log(`  Output  : ./supabase_backup/\n`);

  // Create backup directory
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const summary = [];

  for (const table of TABLES) {
    console.log(`\n  📦 Exporting: ${table.name}`);

    try {
      const rows = await fetchAllRows(table.name, table.select, table.orderBy);

      const filename = `${table.name}.json`;
      const filepath = join(BACKUP_DIR, filename);

      writeFileSync(filepath, JSON.stringify(rows, null, 2), 'utf-8');

      log(`${pad(rows.length)} rows → supabase_backup/${filename}`);
      summary.push({ table: table.name, rows: rows.length, status: 'OK', file: filename });

    } catch (e) {
      if (e.message.includes('does not exist') || e.message.includes('relation') || e.message.includes('42P01')) {
        warn(`Table "${table.name}" not found — skipping.`);
        summary.push({ table: table.name, rows: 0, status: 'SKIPPED (table not found)', file: '-' });
      } else {
        err(`Failed to export "${table.name}"`, e);
        summary.push({ table: table.name, rows: 0, status: `ERROR: ${e.message}`, file: '-' });
      }
    }
  }

  // ── Write combined manifest ──────────────────────────────────────────────────
  const manifest = {
    exportedAt: new Date().toISOString(),
    supabaseUrl: SUPABASE_URL,
    tables: summary,
    totalRows: summary.reduce((acc, t) => acc + t.rows, 0)
  };
  writeFileSync(join(BACKUP_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

  // ── Print Summary ────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║                  Export Summary                 ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log('  Table                   Rows     Status');
  console.log('  ' + '─'.repeat(55));

  for (const s of summary) {
    const tbl   = s.table.padEnd(24);
    const rows  = String(s.rows).padStart(5);
    console.log(`  ${tbl}  ${rows}    ${s.status}`);
  }

  const totalRows = summary.reduce((acc, t) => acc + t.rows, 0);
  console.log('  ' + '─'.repeat(55));
  console.log(`  ${'TOTAL'.padEnd(24)}  ${String(totalRows).padStart(5)}`);

  console.log(`\n  ✅ Backup saved to: ./supabase_backup/`);
  console.log(`  📋 Manifest:        ./supabase_backup/manifest.json\n`);
}

main().catch((e) => {
  console.error('\n❌ Export failed:', e.message);
  process.exit(1);
});
