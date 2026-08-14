/**
 * A runnable walkthrough of the trade path. `npm run demo` from apps/api.
 *
 * This is not a UI and not a server — it drives the real services against the
 * in-memory adapters and prints what actually happens, so the behaviour can be
 * inspected rather than taken on trust.
 */

import { formatGrams, rialToTomanString, rial, microgram } from '@garm/financial';
import { accountKey, customerAccount, platformAccount, postProcurement, verifyAll } from '@garm/ledger';
import type { SourceTick } from '@garm/domain';

import { FixedClock, MemoryDatabase, MemoryFlags, SequentialIds } from './src/memory.js';
import { goldConfig, TradingService, type PriceSource } from './src/trading.service.js';

const NOW = new Date('2026-08-14T09:00:00Z');
const REFERENCE = 100_000_000n; // 100,000,000 rial/g = 10,000,000 toman/g

const toman = (v: bigint) => `${rialToTomanString(rial(v), { separator: ',' })} تومان`;
const grams = (v: bigint) => `${formatGrams(microgram(v), 6)} گرم`;

function heading(title: string): void {
  console.log(`\n\x1b[1m${title}\x1b[0m`);
  console.log('─'.repeat(64));
}

function row(label: string, value: string): void {
  console.log(`  ${label.padEnd(34)}${value}`);
}

async function main(): Promise<void> {
  const clock = new FixedClock(NOW);
  const db = new MemoryDatabase(new SequentialIds('id'), clock);
  const flags = new MemoryFlags();

  let feed: SourceTick[] = [
    { sourceName: 'source-a', priceRialPerGram: REFERENCE, observedAt: NOW },
    { sourceName: 'source-b', priceRialPerGram: REFERENCE + 40_000n, observedAt: NOW },
  ];
  const prices: PriceSource = { latestTicks: async () => feed };

  const service = new TradingService(
    db,
    flags,
    prices,
    clock,
    new SequentialIds('tx'),
    new Map([['GOLD', goldConfig()]]),
  );

  // ── Setup ────────────────────────────────────────────────────────────
  const user = await db.users().create({ phone: '09120000000' });
  db.setKycStatus(user.id, 'VERIFIED');

  await db.ledger().post(
    postProcurement(
      { transactionId: 'seed-inventory' },
      { asset: 'GOLD', weightUg: 100_000_000n, costRial: 9_800_000_000n },
    ),
  );
  await db.ledger().post(
    // A deposit posted the only way rial can enter: through the ledger.
    (await import('@garm/ledger')).postDeposit(
      { transactionId: 'seed-cash' },
      { userId: user.id, amountRial: 1_000_000_000n },
    ),
  );

  heading('۱. وضعیت اولیه');
  row('موجودی خزانه', grams(db.balanceOf(accountKey(platformAccount('GOLD', 'INVENTORY')), 'GOLD')));
  row('کیف پول مشتری', toman(db.balanceOf(accountKey(customerAccount(user.id, 'IRR')), 'IRR')));
  row('میانگین بهای تمام‌شده', toman(98_000_000n) + ' هر گرم');

  // ── Price feed ───────────────────────────────────────────────────────
  heading('۲. قیمت لحظه‌ای (نمایشی — قابل اجرا نیست)');
  const buyPrice = await service.indicativePrice('GOLD', 'BUY');
  const sellPrice = await service.indicativePrice('GOLD', 'SELL');
  row('وضعیت فید', String(buyPrice?.status));
  row('قیمت خرید مشتری', toman(buyPrice?.price ?? 0n) + ' هر گرم');
  row('قیمت فروش مشتری', toman(sellPrice?.price ?? 0n) + ' هر گرم');
  row('اسپرد', toman((buyPrice?.price ?? 0n) - (sellPrice?.price ?? 0n)) + ' هر گرم');

  // ── Quote ────────────────────────────────────────────────────────────
  heading('۳. صدور quote — خرید ۱۰ میلیون تومان طلا');
  const quoted = await service.issueQuote({
    userId: user.id,
    assetCode: 'GOLD',
    side: 'BUY',
    amountRial: 100_000_000n,
  });
  if (!quoted.ok) {
    console.error('quote refused:', quoted.reason);
    process.exit(1);
  }
  const q = quoted.quote;
  row('قیمت مرجع', toman(q.referencePriceRial) + ' هر گرم');
  row('قیمت اجرای معامله', toman(q.executionPriceRial) + ' هر گرم');
  row('مبلغ ناخالص', toman(q.grossRial));
  row('کارمزد (۰٫۵٪)', toman(q.feeRial));
  row('مبلغ خالص', toman(q.netRial));
  row('طلای دریافتی', grams(q.weightUg));
  row('اعتبار تا', `${Math.round((q.expiresAt.getTime() - NOW.getTime()) / 1000)} ثانیه`);
  row('ظرفیت رزروشده', grams(await db.reservations().openWeightFor('GOLD')));

  // ── Execute ──────────────────────────────────────────────────────────
  heading('۴. اجرای معامله');
  const executed = await service.execute({
    quoteId: q.id,
    userId: user.id,
    idempotencyKey: 'demo-buy',
  });
  if (!executed.ok) {
    console.error('execution refused:', executed.reason);
    process.exit(1);
  }
  row('وضعیت معامله', executed.trade.state);
  row('مسیر طی‌شده', executed.trade.history.join(' → '));
  console.log('\n  \x1b[2mمالکیت در LEDGER_POSTED قطعی شد. تخصیص کاستودی ناهمگام است\x1b[0m');
  console.log('  \x1b[2mو مالکیت مشتری به موفقیت آن وابسته نیست.\x1b[0m');

  heading('۵. ثبت در دفتر کل (دوطرفه)');
  const entry = db.store.entries.at(-1);
  for (const line of entry?.lines ?? []) {
    const amount = line.asset === 'IRR' ? toman(line.amount) : grams(line.amount);
    row(accountKey(line.account), amount);
  }
  const drift = (entry?.lines ?? []).reduce<Record<string, bigint>>((acc, l) => {
    acc[l.asset] = (acc[l.asset] ?? 0n) + l.amount;
    return acc;
  }, {});
  row('— تراز IRR', String(drift['IRR'] ?? 0n));
  row('— تراز GOLD', String(drift['GOLD'] ?? 0n));

  // ── Idempotency ──────────────────────────────────────────────────────
  heading('۶. تکرار درخواست با همان Idempotency-Key');
  const before = db.store.entries.length;
  const retry = await service.execute({
    quoteId: q.id,
    userId: user.id,
    idempotencyKey: 'demo-buy',
  });
  row('نتیجه', retry.ok && retry.replayed ? 'replay — پاسخ اصلی برگشت' : 'ثبت جدید (!)');
  row('تعداد entry دفتر', `${before} → ${db.store.entries.length}`);

  // ── Refusals ─────────────────────────────────────────────────────────
  heading('۷. مسیرهای رد شدن');
  const twice = await service.execute({ quoteId: q.id, userId: user.id, idempotencyKey: 'other' });
  row('اجرای دوباره‌ی همان quote', twice.ok ? 'پذیرفته (!)' : twice.reason);

  feed = [
    { sourceName: 'source-a', priceRialPerGram: REFERENCE, observedAt: NOW },
    { sourceName: 'source-b', priceRialPerGram: REFERENCE + 20_000_000n, observedAt: NOW },
  ];
  const halted = await service.issueQuote({
    userId: user.id,
    assetCode: 'GOLD',
    side: 'BUY',
    amountRial: 100_000_000n,
  });
  row('اختلاف ۲۰٪ بین دو منبع قیمت', halted.ok ? 'پذیرفته (!)' : halted.reason);
  feed = [
    { sourceName: 'source-a', priceRialPerGram: REFERENCE, observedAt: NOW },
    { sourceName: 'source-b', priceRialPerGram: REFERENCE + 40_000n, observedAt: NOW },
  ];

  await flags.set('BUY_ENABLED', false);
  const killed = await service.issueQuote({
    userId: user.id,
    assetCode: 'GOLD',
    side: 'BUY',
    amountRial: 100_000_000n,
  });
  row('kill switch خرید', killed.ok ? 'پذیرفته (!)' : killed.reason);
  await flags.set('BUY_ENABLED', true);

  const tiny = await service.issueQuote({
    userId: user.id,
    assetCode: 'GOLD',
    side: 'BUY',
    amountRial: 1_000n,
  });
  row('زیر حداقل معامله', tiny.ok ? 'پذیرفته (!)' : tiny.reason);

  // ── Sell back ────────────────────────────────────────────────────────
  heading('۸. فروش همان مقدار طلا');
  const sellQuote = await service.issueQuote({
    userId: user.id,
    assetCode: 'GOLD',
    side: 'SELL',
    weightUg: q.weightUg,
  });
  if (!sellQuote.ok) {
    console.error('sell quote refused:', sellQuote.reason);
    process.exit(1);
  }
  row('قیمت اجرای فروش', toman(sellQuote.quote.executionPriceRial) + ' هر گرم');
  row('مبلغ خالص دریافتی', toman(sellQuote.quote.netRial));
  await service.execute({ quoteId: sellQuote.quote.id, userId: user.id, idempotencyKey: 'demo-sell' });

  // ── Final state ──────────────────────────────────────────────────────
  heading('۹. وضعیت نهایی');
  const finalRial = db.balanceOf(accountKey(customerAccount(user.id, 'IRR')), 'IRR');
  row('طلای مشتری', grams(db.balanceOf(accountKey(customerAccount(user.id, 'GOLD')), 'GOLD')));
  row('کیف پول مشتری', toman(finalRial));
  row('هزینه‌ی رفت‌وبرگشت', toman(1_000_000_000n - finalRial));
  row('موجودی خزانه', grams(db.balanceOf(accountKey(platformAccount('GOLD', 'INVENTORY')), 'GOLD')));
  row('درآمد کارمزد', toman(db.balanceOf(accountKey(platformAccount('IRR', 'FEE_REVENUE')), 'IRR')));

  heading('۱۰. بررسی invariant دفتر کل');
  const verdict = verifyAll(db.store.entries);
  row('تعداد entry', String(db.store.entries.length));
  row('همه تراز؟', verdict.ok ? '\x1b[32mبله\x1b[0m' : `\x1b[31mخیر — ${verdict.offending.join(', ')}\x1b[0m`);

  const outbox = await db.outbox().pending();
  row('رویدادهای outbox', outbox.map((e) => e.eventType).join(', '));

  console.log();
  process.exit(verdict.ok ? 0 : 1);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
