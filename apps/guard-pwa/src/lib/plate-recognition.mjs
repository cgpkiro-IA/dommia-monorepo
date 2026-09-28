export function extractPlateCandidate(text) {
  const tokens = text.toUpperCase().match(/[A-Z0-9]+/g) || [];

  for (let start = 0; start < tokens.length; start += 1) {
    for (const tokenCount of [4, 3, 2, 1]) {
      const candidate = tokens.slice(start, start + tokenCount).join('');
      const match = candidate.match(/^([A-Z]{3})([0-9]{3})([A-Z])$/)
        || candidate.match(/^([A-Z]{3})([0-9]{4})$/)
        || candidate.match(/^([A-Z]{2})([0-9]{4})([A-Z])$/)
        || candidate.match(/^([A-Z]{2})([0-9]{3})([A-Z])$/)
        || candidate.match(/^([A-Z]{3})([0-9]{3})$/);

      if (!match) continue;
      if (match.length === 4) return `${match[1]}-${match[2]}-${match[3]}`;
      return `${match[1]}-${match[2]}`;
    }
  }

  return null;
}