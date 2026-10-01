import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHmac, randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(apiRoot, '../..');

for (const envFile of ['.env.local', '.env']) {
  dotenv.config({ path: resolve(apiRoot, envFile) });
}

export const tenantSlug = 'guard-qa';
const tenantDatabaseSlug = tenantSlug.replace(/-/g, '_');
export const apiBase = process.env.DOMMIA_TEST_API_BASE || 'http://localhost:4000/api/v1';
export const pool = new pg.Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || 'dommia_admin',
  password: process.env.POSTGRES_PASSWORD || 'dommia_secret_2026',
  database: process.env.POSTGRES_DB || 'dommia_master',
});

let setupPromise;

export async function prepareGuardQa() {
  if (!setupPromise) {
    setupPromise = (async () => {
      const timeoutMs = Number(process.env.DOMMIA_TEST_STARTUP_TIMEOUT_MS || 15000);
      const deadline = Date.now() + timeoutMs;
      let lastHealthError = 'sin respuesta';
      let isHealthy = false;
      while (Date.now() < deadline) {
        try {
          const response = await fetch(`${apiBase}/health`, { signal: AbortSignal.timeout(1000) });
          if (response.status === 200) {
            isHealthy = true;
            break;
          }
          lastHealthError = `HTTP ${response.status}`;
        } catch (error) {
          lastHealthError = error instanceof Error ? error.message : 'error de conexión';
        }
        await new Promise((resolveWait) => setTimeout(resolveWait, 250));
      }
      assert.equal(isHealthy, true, `API no disponible en ${apiBase} después de ${timeoutMs} ms (${lastHealthError}); levanta apps/api antes de ejecutar las pruebas.`);
      const seed = await readFile(resolve(repositoryRoot, 'scratch/seed_guard_qa.sql'), 'utf8');
      const migrations = [
        '003_finance_campaign_ledger.sql',
        '004_resident_access.sql',
        '005_resident_contact_login.sql',
        '006_notification_channels.sql',
        '007_resident_password_resets.sql',
        '008_resident_sessions.sql',
        '009_stripe_events.sql',
        '010_stripe_connected_accounts.sql',
        '011_access_qr_replay_protection.sql',
        '012_manual_access_audit.sql',
        '013_guard_operations.sql',
        '014_tenant_feature_tables.sql',
        '015_admin_mfa.sql',
        '016_guard_services.sql',
        '017_crm_alerts.sql',
        '018_guard_consigns_and_panic.sql',
        '019_tenant_guard_schema_completion.sql',
        '020_tenant_finance_schema_completion.sql',
        '021_resident_app_refresh_sessions.sql',
        '022_resident_push_tokens.sql',
        '023_tenant_monthly_financial_reports.sql',
        '024_guard_access_points.sql',
      ];
      for (const migrationName of migrations) {
        const migration = await readFile(resolve(repositoryRoot, 'docker/migrations', migrationName), 'utf8');
        await pool.query(migration);
      }
      await pool.query(seed);
    })();
  }
  return setupPromise;
}

export async function closeTestPool() {
  await pool.end();
}

export function uniqueId() {
  return randomUUID();
}

export async function tenantUserId(email, role) {
  const result = await pool.query(`
    SELECT u.id
    FROM public.users u
    JOIN public.user_tenants ut ON ut.user_id = u.id
    JOIN public.tenants t ON t.id = ut.tenant_id
    WHERE lower(u.email) = lower($1)
      AND lower(replace(t.slug, '-', '_')) = $2
      AND ut.role = $3 AND u.is_active = TRUE
  `, [email, tenantDatabaseSlug, role]);
  assert.equal(result.rowCount, 1, `Debe existir el usuario QA ${email} con rol ${role}.`);
  return result.rows[0].id;
}

export async function signTenantToken(email, role) {
  const userId = await tenantUserId(email, role);
  const tenant = await pool.query(
    "SELECT id FROM public.tenants WHERE lower(replace(slug, '-', '_')) = $1",
    [tenantDatabaseSlug],
  );
  assert.equal(tenant.rowCount, 1, 'Debe existir el tenant QA.');
  const claims = Buffer.from(JSON.stringify({
    sub: userId,
    email,
    role,
    tenantId: tenant.rows[0].id,
    tenantSlug,
    exp: Date.now() + 5 * 60 * 1000,
  })).toString('base64url');
  const secret = process.env.AUTH_TOKEN_SECRET;
  assert.ok(secret && secret.length >= 32, 'AUTH_TOKEN_SECRET debe estar configurado para las pruebas.');
  const signature = createHmac('sha256', secret)
    .update(claims)
    .digest('base64url');
  return `${claims}.${signature}`;
}

export async function request(path, { token, ...init } = {}) {
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${apiBase}${path}`, { ...init, headers, cache: 'no-store' });
}

export async function responseData(response) {
  const body = await response.json();
  assert.equal(body.success, true, body.message || `API respondió HTTP ${response.status}.`);
  return body.data;
}