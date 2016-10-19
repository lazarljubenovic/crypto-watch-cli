function positiveMod(a: number, b: number): number {
  return ((a % b) + b) % b;
}

export = positiveMod;
