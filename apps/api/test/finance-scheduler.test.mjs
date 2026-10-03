import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const { FinanceSchedulerService } = require('../dist/modules/finance/services/finance-scheduler.service.js');

test('monthly billing waits past Node timer limit without running early', async (context) => {
  const now = new Date(2026, 9, 1, 12);
  const nextRun = new Date(2026, 10, 1);
  const maxDelay = 2_147_483_647;
  const runs = [];
  context.mock.timers.enable({ apis: ['Date', 'setTimeout'], now });
  const scheduler = new FinanceSchedulerService({}, {});
  scheduler.runMonthlyBilling = async (year, month) => { runs.push([year, month]); };

  try {
    scheduler.onModuleInit();
    context.mock.timers.tick(maxDelay);
    assert.deepEqual(runs, []);

    context.mock.timers.tick(nextRun.getTime() - now.getTime() - maxDelay);
    await Promise.resolve();
    assert.deepEqual(runs, [[2026, 11]]);
  } finally {
    scheduler.onModuleDestroy();
    context.mock.timers.reset();
  }
});