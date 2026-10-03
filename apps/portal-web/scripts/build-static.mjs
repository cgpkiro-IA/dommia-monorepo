import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const result = spawnSync(process.execPath, [require.resolve('next/dist/bin/next'), 'build'], {
  cwd: new URL('..', import.meta.url),
  env: {
    ...process.env,
    NEXT_PUBLIC_PORTAL_STATIC_MODE: '1',
    NEXT_PUBLIC_SITE_URL: 'https://dommia.com.mx',
  },
  stdio: 'inherit',
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;