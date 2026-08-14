/**
 * Price feed guards. SPEC §23, §24.
 *
 * ## Why a single feed is a single point of insolvency
 *
 * The platform is the counterparty to every trade. It quotes from a reference
 * price, and if that reference is wrong — a decimal slip, a stale cache, a
 * vendor outage returning the last good value forever — it will keep quoting
 * confidently at the wrong number until someone notices. In a fast market that
 * is minutes, and minutes is enough to lose the company.
 *
 * So: at least two independent sources, a deviation guard against the trailing
 * median, a staleness clock, and a halt state that stops new quotes. Pure
 * decision logic — the caller supplies ticks and the current time.
 */

export type FeedStatus = 'LIVE' | 'DEGRADED' | 'STALE' | 'UNAVAILABLE' | 'HALTED';

export interface SourceTick {
  readonly sourceName: string;
  /** Rial per gram, on the asset's declared weight basis. */
  readonly priceRialPerGram: bigint;
  readonly observedAt: Date;
}

export interface FeedPolicy {
  /** Below this many live sources the feed is DEGRADED rather than LIVE. */
  readonly minimumSources: number;
  /** A tick further than this from the median is rejected as an outlier. */
  readonly maxDeviationBps: number;
  /** Sources disagreeing by more than this halt the feed entirely. */
  readonly maxSourceSpreadBps: number;
  /** Older than this and a tick no longer counts as live. */
  readonly stalenessSeconds: number;
  /** Nothing fresh for this long and the feed is unavailable. */
  readonly unavailableSeconds: number;
}

export const DEFAULT_FEED_POLICY: FeedPolicy = {
  minimumSources: 2,
  maxDeviationBps: 300, // 3%
  maxSourceSpreadBps: 500, // 5%
  stalenessSeconds: 30,
  unavailableSeconds: 120,
};

export interface FeedAssessment {
  readonly status: FeedStatus;
  /** Median of the accepted ticks. Absent when no price can be trusted. */
  readonly referencePrice: bigint | null;
  readonly acceptedSources: readonly string[];
  readonly rejectedSources: readonly string[];
  readonly reasons: readonly string[];
}

function medianOf(values: readonly bigint[]): bigint {
  const sorted = [...values].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[middle] as bigint;
  }
  // Even count: average the two central values, flooring. Using the median
  // rather than the mean is deliberate — a single wild tick cannot drag it.
  return ((sorted[middle - 1] as bigint) + (sorted[middle] as bigint)) / 2n;
}

function deviationBps(value: bigint, reference: bigint): number {
  if (reference === 0n) {
    return Number.POSITIVE_INFINITY;
  }
  const difference = value > reference ? value - reference : reference - value;
  return Number((difference * 10_000n) / reference);
}

function ageSeconds(observedAt: Date, now: Date): number {
  return Math.floor((now.getTime() - observedAt.getTime()) / 1000);
}

/**
 * Assess the feed from the latest tick of each source.
 *
 * Returns the status and, when one can be trusted, the reference price. A
 * `HALTED`, `STALE` or `UNAVAILABLE` result must stop new quote issuance —
 * already-issued quotes are honoured until they expire (SPEC §24).
 */
export function assessFeed(
  ticks: readonly SourceTick[],
  now: Date,
  policy: FeedPolicy = DEFAULT_FEED_POLICY,
): FeedAssessment {
  const reasons: string[] = [];

  if (ticks.length === 0) {
    return {
      status: 'UNAVAILABLE',
      referencePrice: null,
      acceptedSources: [],
      rejectedSources: [],
      reasons: ['no sources reporting'],
    };
  }

  const fresh = ticks.filter((tick) => ageSeconds(tick.observedAt, now) <= policy.stalenessSeconds);
  const stale = ticks.filter((tick) => !fresh.includes(tick));

  if (fresh.length === 0) {
    const oldest = Math.min(...ticks.map((t) => ageSeconds(t.observedAt, now)));
    const status: FeedStatus = oldest >= policy.unavailableSeconds ? 'UNAVAILABLE' : 'STALE';
    return {
      status,
      referencePrice: null,
      acceptedSources: [],
      rejectedSources: ticks.map((t) => t.sourceName),
      reasons: [`no source fresher than ${policy.stalenessSeconds}s`],
    };
  }

  // The provisional median is computed from all fresh ticks; outliers are then
  // measured against it and dropped, and the reference recomputed from what
  // survives. Measuring against the mean instead would let the outlier shift
  // the very yardstick used to detect it.
  const provisional = medianOf(fresh.map((tick) => tick.priceRialPerGram));
  const accepted = fresh.filter(
    (tick) => deviationBps(tick.priceRialPerGram, provisional) <= policy.maxDeviationBps,
  );
  const rejected = [
    ...stale.map((t) => t.sourceName),
    ...fresh.filter((t) => !accepted.includes(t)).map((t) => t.sourceName),
  ];

  if (accepted.length === 0) {
    return {
      status: 'HALTED',
      referencePrice: null,
      acceptedSources: [],
      rejectedSources: rejected,
      reasons: ['every fresh tick deviated beyond the accepted band'],
    };
  }

  const prices = accepted.map((tick) => tick.priceRialPerGram);
  const lowest = prices.reduce((a, b) => (a < b ? a : b));
  const highest = prices.reduce((a, b) => (a > b ? a : b));

  // Sources that disagree wildly with each other mean at least one is wrong and
  // there is no way to tell which. Trading through that is guessing.
  if (accepted.length > 1 && deviationBps(highest, lowest) > policy.maxSourceSpreadBps) {
    return {
      status: 'HALTED',
      referencePrice: null,
      acceptedSources: accepted.map((t) => t.sourceName),
      rejectedSources: rejected,
      reasons: [`sources disagree by more than ${policy.maxSourceSpreadBps}bps`],
    };
  }

  if (rejected.length > 0) {
    reasons.push(`${rejected.length} source(s) rejected`);
  }
  if (accepted.length < policy.minimumSources) {
    reasons.push(`only ${accepted.length} source(s) accepted, ${policy.minimumSources} required`);
  }

  return {
    status: accepted.length >= policy.minimumSources ? 'LIVE' : 'DEGRADED',
    referencePrice: medianOf(prices),
    acceptedSources: accepted.map((t) => t.sourceName),
    rejectedSources: rejected,
    reasons,
  };
}

/**
 * Whether new quotes may be issued.
 *
 * DEGRADED still permits trading — running on one source is worse than two but
 * better than refusing every customer — while surfacing the reason so
 * operations can decide whether to halt manually. Anything worse stops
 * issuance.
 */
export function mayIssueQuotes(assessment: FeedAssessment): boolean {
  return assessment.status === 'LIVE' || assessment.status === 'DEGRADED';
}
