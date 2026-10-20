/**
 * Parse Supabase-style INSERT dumps for public.products (researchpeptide.uk export).
 */

export interface SupabaseProductRow {
  id: string;
  title: string;
  description: string;
  price: string;
  inventory: number;
  images: string[];
  categories: string[];
  specifications: string[] | null;
  rating: string | null;
  reviewCount: number;
  createdAt: string;
  variants: SupabaseVariant[];
  compareAtPrice: string | null;
  slug: string;
}

export interface SupabaseVariant {
  attributes?: Record<string, string>;
  display_name?: string;
  variation_id?: number;
  display_price?: number;
  display_regular_price?: number;
  is_in_stock?: boolean;
  is_purchasable?: boolean;
  max_qty?: number;
}

function unescapePgString(value: string): string {
  return value.replace(/''/g, "'").replace(/\\'/g, "'");
}

function parsePgArray(raw: string): string[] {
  const inner = raw.slice(6, -1).trim();
  if (!inner) return [];
  const items: string[] = [];
  let current = '';
  let inString = false;
  for (let i = 0; i < inner.length; i++) {
    const char = inner[i];
    if (!inString) {
      if (char === "'") {
        inString = true;
        current = '';
        continue;
      }
      if (char === ',') continue;
      continue;
    }
    if (char === "'") {
      if (inner[i + 1] === "'") {
        current += "'";
        i += 1;
        continue;
      }
      items.push(current);
      inString = false;
      continue;
    }
    current += char;
  }
  return items;
}

function parseField(
  sql: string,
  index: number
): { value: string; next: number; kind: 'string' | 'number' | 'null' | 'array' } {
  while (index < sql.length && /\s/.test(sql[index])) index += 1;
  if (sql.startsWith('null', index)) {
    return { value: '', next: index + 4, kind: 'null' };
  }
  if (sql.startsWith('ARRAY[', index)) {
    let depth = 0;
    let i = index + 5;
    for (; i < sql.length; i++) {
      const char = sql[i];
      if (char === '[') depth += 1;
      if (char === ']') {
        depth -= 1;
        if (depth === 0) {
          i += 1;
          break;
        }
      }
    }
    return { value: sql.slice(index, i), next: i, kind: 'array' };
  }
  if (sql[index] === "'") {
    let i = index + 1;
    let out = '';
    while (i < sql.length) {
      const char = sql[i];
      if (char === "'") {
        if (sql[i + 1] === "'") {
          out += "'";
          i += 2;
          continue;
        }
        i += 1;
        break;
      }
      out += char;
      i += 1;
    }
    return { value: out, next: i, kind: 'string' };
  }
  const numMatch = sql.slice(index).match(/^-?\d+(?:\.\d+)?/);
  if (numMatch) {
    return { value: numMatch[0], next: index + numMatch[0].length, kind: 'number' };
  }
  throw new Error(`Unexpected token at ${index}: ${sql.slice(index, index + 40)}`);
}

function parseRow(sql: string, start: number): { row: SupabaseProductRow; next: number } {
  let index = start;
  if (sql[index] === '(') index += 1;

  const fields: Array<{ kind: string; value: string }> = [];
  for (let field = 0; field < 14; field++) {
    if (field > 0) {
      while (index < sql.length && /\s/.test(sql[index])) index += 1;
      if (sql[index] === ',') index += 1;
    }
    const parsed = parseField(sql, index);
    index = parsed.next;
    fields.push({ kind: parsed.kind, value: parsed.value });
  }

  while (index < sql.length && /\s/.test(sql[index])) index += 1;
  if (sql[index] === ')') index += 1;

  const variantsRaw = fields[11].kind === 'null' ? '[]' : fields[11].value;
  let variants: SupabaseVariant[] = [];
  try {
    variants = JSON.parse(variantsRaw) as SupabaseVariant[];
  } catch {
    variants = [];
  }

  const row: SupabaseProductRow = {
    id: fields[0].value,
    title: unescapePgString(fields[1].value),
    description: unescapePgString(fields[2].value),
    price: fields[3].value,
    inventory: Number(fields[4].value),
    images: fields[5].kind === 'array' ? parsePgArray(fields[5].value) : [],
    categories: fields[6].kind === 'array' ? parsePgArray(fields[6].value) : [],
    specifications: fields[7].kind === 'array' ? parsePgArray(fields[7].value) : null,
    rating: fields[8].kind === 'null' ? null : fields[8].value,
    reviewCount: Number(fields[9].value),
    createdAt: fields[10].value,
    variants,
    compareAtPrice: fields[12].kind === 'null' ? null : fields[12].value,
    slug: fields[13].value,
  };

  return { row, next: index };
}

export function parseSupabaseProductsSql(sql: string): SupabaseProductRow[] {
  const marker = sql.indexOf('VALUES');
  if (marker < 0) throw new Error('VALUES clause not found');
  let index = marker + 6;
  const rows: SupabaseProductRow[] = [];

  while (index < sql.length) {
    while (index < sql.length && /[\s,]/.test(sql[index])) index += 1;
    if (sql[index] === ';' || index >= sql.length) break;
    if (sql[index] !== '(') break;
    const { row, next } = parseRow(sql, index);
    rows.push(row);
    index = next;
  }

  return rows;
}
