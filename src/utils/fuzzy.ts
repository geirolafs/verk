export type FuzzyResult = {
  score: number;
  indices: number[];
};

export function fuzzyMatch(query: string, target: string): FuzzyResult | null {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  const indices: number[] = [];
  let score = 0;
  let qi = 0;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      indices.push(ti);
      score += 1;
      // word boundary bonus
      if (ti === 0 || t[ti - 1] === "-" || t[ti - 1] === "_" || t[ti - 1] === "/") {
        score += 2;
      }
      // consecutive bonus
      if (indices.length > 1 && indices[indices.length - 2] === ti - 1) {
        score += 3;
      }
      qi++;
    }
  }

  if (qi < q.length) return null; // not all chars matched
  return { score, indices };
}
