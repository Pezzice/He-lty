"use client";
import { useState } from "react";
import { Scheda } from "@/components/Scheda";
import { useProfilo } from "@/lib/archivio";
import { ETICHETTE_ATTIVITA, bmr, fabbisognoKcal, obiettivoAcquaMl, obiettivoPassi, proteineG } from "@/lib/calcoli";
import type { LivelloAttivita, Profilo, Sesso } from "@/lib/types";

function num(v: string): number | null {
  const n = Number(v.replace(",", "."));
  return v.trim() === "" || Number.isNaN(n) ? null : n;
}

export default function PaginaProfilo() {
  const { profilo, salva, pronto } = useProfilo();
  const [nuovoIntegratore, setNuovoIntegratore] = useState("");
  if (!pronto) return null;

  const set = <K extends keyof Profilo>(k: K, v: Profilo[K]) => salva({ ...profilo, [k]: v });
  const kcal = fabbisognoKcal(profilo);
  const acqua = obiettivoAcquaMl(profilo);
  const proteine = proteineG(profilo);
  const metabolismo = bmr(profilo);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Profilo</h1>

      <Scheda titolo="Dati di base">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="col-span-2">Nome
            <input value={profilo.nome} onChange={(e) => set("nome", e.target.value)} />
          </label>
          <label>Anno di nascita
            <input type="number" inputMode="numeric" value={profilo.annoNascita ?? ""} onChange={(e) => set("annoNascita", num(e.target.value))} />
          </label>
          <label>Sesso biologico
            <select value={profilo.sesso ?? ""} onChange={(e) => set("sesso", (e.target.value || null) as Sesso | null)}>
              <option value="">–</option>
              <option value="F">Femmina</option>
              <option value="M">Maschio</option>
            </select>
          </label>
          <label>Peso (kg)
            <input type="number" inputMode="decimal" value={profilo.pesoKg ?? ""} onChange={(e) => set("pesoKg", num(e.target.value))} />
          </label>
          <label>Altezza (cm)
            <input type="number" inputMode="numeric" value={profilo.altezzaCm ?? ""} onChange={(e) => set("altezzaCm", num(e.target.value))} />
          </label>
          <label className="col-span-2">Livello di attività abituale
            <select value={profilo.attivita} onChange={(e) => set("attivita", e.target.value as LivelloAttivita)}>
              {Object.entries(ETICHETTE_ATTIVITA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        </div>
      </Scheda>

      <Scheda titolo="Situazioni particolari">
        <p className="mb-3 text-xs text-muted">Servono a evitare suggerimenti non adatti a te.</p>
        <div className="flex flex-col gap-2 text-sm">
          {([
            ["gravidanza", "Gravidanza o allattamento"],
            ["restrizioneLiquidi", "Il medico mi ha dato un limite di liquidi"],
            ["disturbiAlimentari", "Disturbi alimentari, attuali o passati (nasconde calorie e obiettivi di peso)"],
          ] as const).map(([k, etichetta]) => (
            <label key={k} className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" checked={profilo[k]} onChange={(e) => set(k, e.target.checked)} />
              {etichetta}
            </label>
          ))}
        </div>
      </Scheda>

      <Scheda titolo="Integratori che prendi">
        <ul className="mb-3 flex flex-col gap-1 text-sm">
          {profilo.integratori.map((i) => (
            <li key={i} className="flex justify-between">
              {i}
              <button aria-label="Rimuovi" className="text-muted" onClick={() => set("integratori", profilo.integratori.filter((x) => x !== i))}>×</button>
            </li>
          ))}
        </ul>
        <form className="flex gap-2" onSubmit={(e) => {
          e.preventDefault();
          const v = nuovoIntegratore.trim();
          if (v && !profilo.integratori.includes(v)) set("integratori", [...profilo.integratori, v]);
          setNuovoIntegratore("");
        }}>
          <input placeholder="Es. vitamina D 1000 UI" value={nuovoIntegratore} onChange={(e) => setNuovoIntegratore(e.target.value)} />
          <button className="rounded-lg bg-accent px-4 text-sm font-medium text-white">Aggiungi</button>
        </form>
      </Scheda>

      <Scheda titolo="I tuoi obiettivi">
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          {metabolismo && kcal && (<><dt className="text-muted">Metabolismo basale</dt><dd>{metabolismo} kcal</dd>
            <dt className="text-muted">Fabbisogno stimato</dt><dd>{kcal} kcal</dd></>)}
          <dt className="text-muted">Acqua da bevande</dt><dd>{acqua ? `${acqua} ml` : profilo.restrizioneLiquidi ? "limite del medico" : "–"}</dd>
          <dt className="text-muted">Proteine</dt><dd>{proteine ? `${proteine} g` : "–"}</dd>
          <dt className="text-muted">Passi</dt><dd>{obiettivoPassi(profilo)}</dd>
          <dt className="text-muted">Attività moderata</dt><dd>150 min a settimana</dd>
        </dl>
        <p className="mt-3 text-xs text-muted">
          Stime per adulti sani da LARN, EFSA e OMS (Mifflin-St Jeor per il metabolismo). Non sono indicazioni mediche.
        </p>
      </Scheda>
    </div>
  );
}
