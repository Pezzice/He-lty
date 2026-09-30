"use client";
import { useRef, useState } from "react";
import { perGrammi, somma } from "@/lib/nutrienti";
import type { VoceAlimento } from "@/lib/types";

/** Riduce la foto a max 1280 px in JPEG, per restare sotto i limiti di upload. */
async function comprimi(file: File): Promise<string> {
  const img = await createImageBitmap(file);
  const scala = Math.min(1, 1280 / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scala);
  canvas.height = Math.round(img.height * scala);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

type Stato =
  | { fase: "riposo" }
  | { fase: "analisi"; anteprima: string }
  | { fase: "revisione"; anteprima: string; descrizione: string; voci: VoceAlimento[] }
  | { fase: "errore"; messaggio: string };

export function FotoPasto({ mostraKcal, onSalva }: { mostraKcal: boolean; onSalva: (descrizione: string, voci: VoceAlimento[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [stato, setStato] = useState<Stato>({ fase: "riposo" });

  const analizza = async (file: File) => {
    let anteprima: string;
    try {
      anteprima = await comprimi(file);
    } catch {
      setStato({ fase: "errore", messaggio: "Non riesco a leggere questa immagine." });
      return;
    }
    setStato({ fase: "analisi", anteprima });
    try {
      const res = await fetch("/api/analizza-pasto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ immagine: anteprima }),
      });
      const dati = await res.json();
      if (!res.ok) throw new Error(dati.errore ?? "Analisi non riuscita.");
      setStato({ fase: "revisione", anteprima, descrizione: dati.descrizione, voci: dati.voci });
    } catch (e) {
      setStato({ fase: "errore", messaggio: e instanceof Error ? e.message : "Analisi non riuscita." });
    }
  };

  const bottone = (
    <>
      <input ref={input} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) analizza(f); }} />
      <button type="button" onClick={() => input.current?.click()}
        className="w-full rounded-lg border border-accent px-4 py-2.5 text-sm font-medium text-accent">
        Fotografa il piatto
      </button>
    </>
  );

  if (stato.fase === "riposo" || stato.fase === "errore") {
    return (
      <div className="flex flex-col gap-1">
        {bottone}
        {stato.fase === "errore" && <p className="text-sm text-danger">{stato.messaggio}</p>}
        <p className="text-xs text-muted">La foto viene inviata a Claude (Anthropic) solo per l&apos;analisi e non viene salvata.</p>
      </div>
    );
  }

  if (stato.fase === "analisi") {
    return (
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={stato.anteprima} alt="" className="h-16 w-16 rounded-lg object-cover" />
        <p className="text-sm text-muted">Sto riconoscendo gli alimenti…</p>
      </div>
    );
  }

  const { voci } = stato;
  const aggiornaVoci = (nuove: VoceAlimento[]) => setStato({ ...stato, voci: nuove });
  const totale = somma(voci.map((v) => perGrammi(v.per100, v.grammi)));

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line p-3">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={stato.anteprima} alt="" className="h-16 w-16 rounded-lg object-cover" />
        <input aria-label="Nome del pasto" value={stato.descrizione} onChange={(e) => setStato({ ...stato, descrizione: e.target.value })} />
      </div>
      <p className="text-xs text-muted">Controlla alimenti e grammi: sono stime dalla foto.</p>
      <ul className="flex flex-col gap-2 text-sm">
        {voci.map((v, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="flex-1">
              {v.nome}
              {v.idTabella === null && <span className="block text-xs text-muted">valori stimati</span>}
            </span>
            <input aria-label={`Grammi di ${v.nome}`} className="!w-20" type="number" inputMode="numeric" min={0} value={v.grammi}
              onChange={(e) => aggiornaVoci(voci.map((x, j) => (j === i ? { ...x, grammi: Math.max(0, Number(e.target.value) || 0) } : x)))} />
            <span className="w-4 text-muted">g</span>
            {mostraKcal && <span className="w-16 text-right text-muted">{Math.round(perGrammi(v.per100, v.grammi).kcal)} kcal</span>}
            <button type="button" aria-label={`Togli ${v.nome}`} className="text-muted" onClick={() => aggiornaVoci(voci.filter((_, j) => j !== i))}>×</button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">
        {mostraKcal && `${Math.round(totale.kcal)} kcal · `}proteine {Math.round(totale.proteine)} g · carboidrati {Math.round(totale.carboidrati)} g · grassi {Math.round(totale.grassi)} g · fibra {Math.round(totale.fibra)} g
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={() => setStato({ fase: "riposo" })} className="rounded-full border border-line px-4 py-2 text-sm">Annulla</button>
        <button type="button" disabled={voci.length === 0}
          onClick={() => { onSalva(stato.descrizione.trim() || "Pasto", voci.filter((v) => v.grammi > 0)); setStato({ fase: "riposo" }); }}
          className="flex-1 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-40">Salva pasto</button>
      </div>
    </div>
  );
}
