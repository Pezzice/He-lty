import { Barra } from "@/components/Scheda";
import type { Nutrienti } from "@/lib/nutrienti";

interface Riga {
  etichetta: string;
  valore: number;
  unita: string;
  obiettivo?: { valore: number; tipo: "minimo" | "massimo"; nota: string };
}

/** Valori del giorno dai pasti fotografati, con i riferimenti di knowledge/01-nutrizione. */
export function TabellaNutrienti({ totale, kcalObiettivo, proteineObiettivo }: { totale: Nutrienti; kcalObiettivo: number | null; proteineObiettivo: number | null }) {
  const righe: Riga[] = [
    ...(kcalObiettivo ? [{ etichetta: "Energia", valore: totale.kcal, unita: "kcal", obiettivo: { valore: kcalObiettivo, tipo: "minimo" as const, nota: "fabbisogno stimato" } }] : []),
    { etichetta: "Proteine", valore: totale.proteine, unita: "g", ...(proteineObiettivo ? { obiettivo: { valore: proteineObiettivo, tipo: "minimo" as const, nota: "obiettivo" } } : {}) },
    { etichetta: "Carboidrati", valore: totale.carboidrati, unita: "g" },
    { etichetta: "di cui zuccheri", valore: totale.zuccheri, unita: "g", ...(kcalObiettivo ? { obiettivo: { valore: Math.round((kcalObiettivo * 0.1) / 4), tipo: "massimo" as const, nota: "OMS: meno del 10% dell'energia" } } : {}) },
    { etichetta: "Grassi", valore: totale.grassi, unita: "g" },
    { etichetta: "di cui saturi", valore: totale.saturi, unita: "g", ...(kcalObiettivo ? { obiettivo: { valore: Math.round((kcalObiettivo * 0.1) / 9), tipo: "massimo" as const, nota: "meno del 10% dell'energia" } } : {}) },
    { etichetta: "Fibra", valore: totale.fibra, unita: "g", obiettivo: { valore: 25, tipo: "minimo", nota: "EFSA: almeno 25 g" } },
    { etichetta: "Sodio", valore: totale.sodio, unita: "mg", obiettivo: { valore: 2000, tipo: "massimo", nota: "OMS: meno di 2 g (5 g di sale)" } },
  ];

  return (
    <table className="w-full text-sm">
      <tbody>
        {righe.map((r) => {
          const oltre = r.obiettivo?.tipo === "massimo" && r.valore > r.obiettivo.valore;
          return (
            <tr key={r.etichetta} className="border-b border-line last:border-0">
              <td className={`py-2 ${r.etichetta.startsWith("di cui") ? "pl-3 text-muted" : ""}`}>{r.etichetta}</td>
              <td className={`whitespace-nowrap py-2 text-right tabular-nums ${oltre ? "font-medium text-danger" : ""}`}>
                {Math.round(r.valore)} {r.unita}
                {r.obiettivo && <span className="text-muted"> / {r.obiettivo.tipo === "massimo" ? "max " : ""}{r.obiettivo.valore}</span>}
              </td>
              <td className="w-24 py-2 pl-3">
                {r.obiettivo && <Barra valore={r.valore} obiettivo={r.obiettivo.valore} colore={oltre ? "bg-danger" : "bg-accent"} />}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
