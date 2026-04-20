export function resolveApiKey(provider: 'anthropic' | 'google', clientKey?: string): string | null {
  const envKey = provider === 'anthropic' ? process.env.ANTHROPIC_API_KEY : process.env.GOOGLE_API_KEY;
  return clientKey || envKey || null;
}

export function stripCodeFences(text: string): string {
  let result = text;

  // Remove opening fence (with optional language identifier, ignoring case)
  result = result.replace(/```(?:jsx|tsx|javascript|typescript)?\n?/gi, '');

  // Remove closing fence
  result = result.replace(/\n?```/g, '');

  // Trim whitespace
  return result.trim();
}

export function ensureRenderCall(code: string): string {
  if (/\brender\s*\(/.test(code)) return code;

  const matches = [...code.matchAll(/(?:const|function)\s+([A-Z]\w+)/g)];
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    return `${code}\n\nrender(<${lastMatch[1]} />);`;
  }
  return code;
}
