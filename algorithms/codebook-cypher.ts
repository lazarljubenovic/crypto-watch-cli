function codebookCypher(plaintext: string,
                        codebook: Map<string, string>): string {
  return plaintext
    .split(' ')
    .map(word => word.trim().toLowerCase())
    .map(word => codebook.get(word) ? codebook.get(word) : word)
    .join (' ');
}

export = codebookCypher;
