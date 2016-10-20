function positiveMod(a: number, b: number): number {
  return ((a % b) + b) % b;
}

function stripWhitespace(s: string): string {
  return s.replace(/\s+/g, '');
}

export = {
  positiveMod,
  stripWhitespace,
};
