/**
 * Cohen's kappa for nominal intent labels (pure; no I/O).
 *
 * percentAgreement is a 0–1 ratio (agreements / n), not a 0–100 percentage.
 * Live human kappa is a protocol concern — this module only computes from pairs.
 */

export type LabelPair = { a: string; b: string };

export type KappaResult = {
  percentAgreement: number;
  kappa: number;
  n: number;
};

export type Disagreement = {
  index: number;
  a: string;
  b: string;
};

export type AgreementReport = KappaResult & {
  disagreements: Disagreement[];
};

function increment(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

/**
 * Cohen's kappa for two annotators on nominal (unordered) labels.
 * When chance agreement pe is 1 and observed agreement is 1, kappa is 1.
 */
export function cohenKappa(pairs: LabelPair[]): KappaResult {
  const n = pairs.length;
  if (n === 0) {
    return { percentAgreement: 0, kappa: 0, n: 0 };
  }

  let agreements = 0;
  const countA = new Map<string, number>();
  const countB = new Map<string, number>();
  const labels = new Set<string>();

  for (const { a, b } of pairs) {
    labels.add(a);
    labels.add(b);
    increment(countA, a);
    increment(countB, b);
    if (a === b) agreements += 1;
  }

  const percentAgreement = agreements / n;
  let pe = 0;
  for (const label of labels) {
    pe += ((countA.get(label) ?? 0) / n) * ((countB.get(label) ?? 0) / n);
  }

  const kappa =
    pe === 1 ? (percentAgreement === 1 ? 1 : 0) : (percentAgreement - pe) / (1 - pe);

  return { percentAgreement, kappa, n };
}

export function agreementReport(
  labelsA: string[],
  labelsB: string[],
): AgreementReport {
  if (labelsA.length !== labelsB.length) {
    throw new Error("agreementReport: labelsA and labelsB must have the same length");
  }
  const pairs: LabelPair[] = labelsA.map((a, i) => ({ a, b: labelsB[i] ?? "" }));
  const stats = cohenKappa(pairs);
  const disagreements: Disagreement[] = [];
  for (let index = 0; index < pairs.length; index += 1) {
    const pair = pairs[index];
    if (pair && pair.a !== pair.b) {
      disagreements.push({ index, a: pair.a, b: pair.b });
    }
  }
  return { ...stats, disagreements };
}
