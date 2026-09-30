// Tabella alimenti: 153 alimenti comuni con nome italiano, valori per 100 g
// da USDA SR28 (knowledge/data/alimenti/alimenti_comuni_it.csv).
import tabella from "@/data/alimenti.json";

export interface Nutrienti {
  kcal: number;
  proteine: number;
  carboidrati: number;
  zuccheri: number;
  grassi: number;
  saturi: number;
  fibra: number;
  sodio: number; // mg
}

export const CHIAVI_NUTRIENTI = ["kcal", "proteine", "carboidrati", "zuccheri", "grassi", "saturi", "fibra", "sodio"] as const;

export interface AlimentoTabella extends Nutrienti {
  id: string;
  nome: string;
}

export const ALIMENTI: AlimentoTabella[] = (tabella as Record<string, string | number | null>[]).map((r) => ({
  id: String(r.id),
  nome: String(r.nome),
  ...Object.fromEntries(CHIAVI_NUTRIENTI.map((k) => [k, Number(r[k] ?? 0)])),
})) as AlimentoTabella[];

export const NUTRIENTI_ZERO: Nutrienti = { kcal: 0, proteine: 0, carboidrati: 0, zuccheri: 0, grassi: 0, saturi: 0, fibra: 0, sodio: 0 };

export function perGrammi(per100: Nutrienti, grammi: number): Nutrienti {
  const f = grammi / 100;
  return Object.fromEntries(CHIAVI_NUTRIENTI.map((k) => [k, per100[k] * f])) as unknown as Nutrienti;
}

export function somma(lista: Nutrienti[]): Nutrienti {
  return lista.reduce(
    (tot, n) => Object.fromEntries(CHIAVI_NUTRIENTI.map((k) => [k, tot[k] + n[k]])) as unknown as Nutrienti,
    NUTRIENTI_ZERO,
  );
}
