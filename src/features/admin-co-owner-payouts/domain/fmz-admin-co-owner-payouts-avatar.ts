// ─── Avatar com iniciais coloridas (mockup de referência, D-9) ─────────────────────
// Substitui um ícone genérico por um avatar deterministicamente colorido a partir de
// um seed estável (ex.: tokenizationId) — mesma cor sempre para o mesmo imóvel/owner,
// sem precisar guardar a cor em nenhum lugar.

const AVATAR_PALETTE = [
  '#3B5EA6', '#3BA66B', '#A6503B', '#6B4FA6', '#C8A020', '#7C3AED',
];

/** Duas primeiras iniciais de um nome (ex.: "Jardim Aurora" → "JA"). "—" se vazio. */
export function deriveInitials(name: string | null | undefined): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '—';
  const first = words[0][0] ?? '';
  const second = words.length > 1 ? words[words.length - 1][0] ?? '' : words[0][1] ?? '';
  return (first + second).toUpperCase();
}

/**
 * Cor determinística da paleta a partir de um seed (hash simples, sem dependência externa).
 * Time: O(k), k = tamanho do seed. Space: O(1).
 */
export function deriveAvatarColor(seed: string | null | undefined): string {
  const value = seed ?? '';
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
}
