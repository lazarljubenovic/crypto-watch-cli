function simpleSubstitution(plaintext: string, map: Map<string, string>): string {
  return plaintext
    .split('')
    .map(letter => map.get(letter) ? map.get(letter) : letter)
    .join('');
}

export = simpleSubstitution;
