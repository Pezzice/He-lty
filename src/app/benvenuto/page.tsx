"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useProfilo } from "@/lib/archivio";
import {
  ETICHETTE_ATTIVITA,
  ETICHETTE_CONDIZIONE,
  ETICHETTE_OBIETTIVO,
  fabbisognoKcal,
  obiettivoAcquaMl,
  obiettivoPassi,
  proteineG,
} from "@/lib/calcoli";
import type { Condizione, LivelloAttivita, Obiettivo, Profilo, Sesso } from "@/lib/types";

function num(v: string): number | null {
  const n = Number(v.replace(",", "."));
  return v.trim() === "" || Number.isNaN(n) ? null : n;
}

const PASSI = ["Nome", "Età e sesso", "Corporatura", "Stile di vita", "Salute", "Integratori", "Consenso"];

function Scelta({ attiva, onClick, children }: { attiva: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full rounded-xl border px-4 py-3 text-left text-sm ${attiva ? "border-accent bg-accent-soft font-medium text-accent" : "border-line"}`}>
      {children}
    </button>
  );
}

export default function Benvenuto() {
  const router = useRouter();
  const { profilo, salva, pronto } = useProfilo();
  const [passo, setPasso] = useState(0);
  const [bozza, setBozza] = useState<Profilo | null>(null);
  const [integratore, setIntegratore] = useState("");
  const [consenso, setConsenso] = useState(false);

  if (!pronto) return null;
  const p = bozza ?? profilo;
  const set = <K extends keyof Profilo>(k: K, v: Profilo[K]) => setBozza({ ...p, [k]: v });
  const anni = p.annoNascita ? new Date().getFullYear() - p.annoNascita : null;

  const errore = ((): string | null => {
    switch (passo) {
      case 0: return p.nome.trim() ? null : "Scrivi il tuo nome.";
      case 1:
        if (!p.annoNascita || anni === null || anni > 110 || anni < 0) return "Inserisci un anno di nascita valido.";
        if (anni < 14) return "Per chi ha meno di 14 anni serve il consenso di un genitore: questa funzione non c'è ancora.";
        return p.sesso ? null : "Scegli il sesso biologico: serve per calcolare il fabbisogno.";
      case 2:
        if (!p.pesoKg || p.pesoKg < 30 || p.pesoKg > 300) return "Inserisci un peso tra 30 e 300 kg.";
        if (!p.altezzaCm || p.altezzaCm < 100 || p.altezzaCm > 250) return "Inserisci un'altezza tra 100 e 250 cm.";
        return null;
      case 6: return consenso ? null : "Per continuare serve il tuo consenso.";
      default: return null;
    }
  })();

  const avanti = () => {
    if (errore) return;
    if (passo < PASSI.length - 1) {
      salva(p);
      setPasso(passo + 1);
    } else {
      salva({ ...p, consensoAt: new Date().toISOString() });
      router.replace("/");
    }
  };

  const toggleCondizione = (c: Condizione) =>
    set("condizioni", p.condizioni.includes(c) ? p.condizioni.filter((x) => x !== c) : [...p.condizioni, c]);

  const kcal = fabbisognoKcal(p);
  const acqua = obiettivoAcquaMl(p);
  const proteine = proteineG(p);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs text-muted">Passo {passo + 1} di {PASSI.length} · {PASSI[passo]}</p>
        <div className="mt-2 flex gap-1">
          {PASSI.map((_, i) => <div key={i} className={`h-1 flex-1 rounded-full ${i <= passo ? "bg-accent" : "bg-line"}`} />)}
        </div>
      </div>

      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); avanti(); }}>
        {passo === 0 && (
          <>
            <h1 className="text-2xl font-semibold">Benvenuto in HE@LTY</h1>
            <p className="text-sm text-muted">Ti farò qualche domanda per darti indicazioni su misura. Ci vuole un minuto.</p>
            <label className="text-sm">Come ti chiami?
              <input autoFocus value={p.nome} onChange={(e) => set("nome", e.target.value)} />
            </label>
          </>
        )}

        {passo === 1 && (
          <>
            <h1 className="text-2xl font-semibold">Piacere, {p.nome.trim()}</h1>
            <label className="text-sm">Anno di nascita
              <input autoFocus type="number" inputMode="numeric" placeholder="Es. 1980" value={p.annoNascita ?? ""}
                onChange={(e) => set("annoNascita", num(e.target.value))} />
            </label>
            <div className="text-sm">
              Sesso biologico
              <div className="mt-1 grid grid-cols-2 gap-2">
                {([["F", "Femmina"], ["M", "Maschio"]] as [Sesso, string][]).map(([v, l]) => (
                  <Scelta key={v} attiva={p.sesso === v} onClick={() => set("sesso", v)}>{l}</Scelta>
                ))}
              </div>
            </div>
          </>
        )}

        {passo === 2 && (
          <>
            <h1 className="text-2xl font-semibold">Peso e altezza</h1>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <label>Peso (kg)
                <input autoFocus type="number" inputMode="decimal" step="0.1" value={p.pesoKg ?? ""} onChange={(e) => set("pesoKg", num(e.target.value))} />
              </label>
              <label>Altezza (cm)
                <input type="number" inputMode="numeric" value={p.altezzaCm ?? ""} onChange={(e) => set("altezzaCm", num(e.target.value))} />
              </label>
            </div>
          </>
        )}

        {passo === 3 && (
          <>
            <h1 className="text-2xl font-semibold">Il tuo stile di vita</h1>
            <div className="flex flex-col gap-2 text-sm">
              Quanto ti muovi di solito?
              {(Object.entries(ETICHETTE_ATTIVITA) as [LivelloAttivita, string][]).map(([v, l]) => (
                <Scelta key={v} attiva={p.attivita === v} onClick={() => set("attivita", v)}>{l}</Scelta>
              ))}
            </div>
            <div className="flex flex-col gap-2 text-sm">
              Cosa ti interessa di più?
              {(Object.entries(ETICHETTE_OBIETTIVO) as [Obiettivo, string][]).map(([v, l]) => (
                <Scelta key={v} attiva={p.obiettivo === v} onClick={() => set("obiettivo", v)}>{l}</Scelta>
              ))}
            </div>
          </>
        )}

        {passo === 4 && (
          <>
            <h1 className="text-2xl font-semibold">La tua salute</h1>
            <p className="text-sm text-muted">Facoltativo. Serve solo a evitare suggerimenti non adatti a te. Spunta ciò che ti riguarda.</p>
            <div className="flex flex-col gap-3 text-sm">
              {p.sesso === "F" && (
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-0.5" checked={p.gravidanza} onChange={(e) => set("gravidanza", e.target.checked)} />
                  Gravidanza o allattamento
                </label>
              )}
              {(Object.entries(ETICHETTE_CONDIZIONE) as [Condizione, string][]).map(([v, l]) => (
                <label key={v} className="flex items-start gap-2">
                  <input type="checkbox" className="mt-0.5" checked={p.condizioni.includes(v)} onChange={() => toggleCondizione(v)} />
                  {l}
                </label>
              ))}
              <label className="flex items-start gap-2">
                <input type="checkbox" className="mt-0.5" checked={p.restrizioneLiquidi} onChange={(e) => set("restrizioneLiquidi", e.target.checked)} />
                Il medico mi ha dato un limite di liquidi
              </label>
              <label className="flex items-start gap-2">
                <input type="checkbox" className="mt-0.5" checked={p.disturbiAlimentari} onChange={(e) => set("disturbiAlimentari", e.target.checked)} />
                Disturbi alimentari, attuali o passati (l&apos;app non mostrerà calorie)
              </label>
            </div>
          </>
        )}

        {passo === 5 && (
          <>
            <h1 className="text-2xl font-semibold">Prendi integratori?</h1>
            <p className="text-sm text-muted">Facoltativo. Li troverai ogni giorno da spuntare.</p>
            <ul className="flex flex-col gap-1 text-sm">
              {p.integratori.map((i) => (
                <li key={i} className="flex justify-between">
                  {i}
                  <button type="button" aria-label="Rimuovi" className="text-muted" onClick={() => set("integratori", p.integratori.filter((x) => x !== i))}>×</button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input placeholder="Es. vitamina D 1000 UI" value={integratore} onChange={(e) => setIntegratore(e.target.value)} />
              <button type="button" className="rounded-lg border border-accent px-4 text-sm font-medium text-accent" onClick={() => {
                const v = integratore.trim();
                if (v && !p.integratori.includes(v)) set("integratori", [...p.integratori, v]);
                setIntegratore("");
              }}>Aggiungi</button>
            </div>
          </>
        )}

        {passo === 6 && (
          <>
            <h1 className="text-2xl font-semibold">Ecco i tuoi obiettivi</h1>
            <dl className="grid grid-cols-2 gap-y-2 rounded-2xl border border-line bg-card p-4 text-sm">
              {kcal && (<><dt className="text-muted">Energia</dt><dd>{kcal} kcal al giorno</dd></>)}
              <dt className="text-muted">Acqua da bevande</dt><dd>{acqua ? `${acqua} ml al giorno` : "secondo il medico"}</dd>
              {proteine && (<><dt className="text-muted">Proteine</dt><dd>circa {proteine} g al giorno</dd></>)}
              <dt className="text-muted">Passi</dt><dd>{obiettivoPassi(p)} al giorno</dd>
              <dt className="text-muted">Movimento</dt><dd>150 min a settimana</dd>
            </dl>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-0.5" checked={consenso} onChange={(e) => setConsenso(e.target.checked)} />
              <span>
                Acconsento al trattamento dei miei dati sulla salute per ricevere suggerimenti sul benessere. Ho capito che HE@LTY
                non è un dispositivo medico e non sostituisce il parere del medico. Per ora i dati restano solo su questo dispositivo.
              </span>
            </label>
          </>
        )}

        {errore && passo !== 6 && <p className="text-sm text-danger" role="alert">{errore}</p>}

        <div className="flex gap-2">
          {passo > 0 && (
            <button type="button" onClick={() => setPasso(passo - 1)} className="rounded-full border border-line px-5 py-2.5 text-sm">Indietro</button>
          )}
          <button type="submit" disabled={Boolean(errore)}
            className="flex-1 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40">
            {passo === PASSI.length - 1 ? "Inizia" : passo === 4 || passo === 5 ? "Avanti (o salta)" : "Avanti"}
          </button>
        </div>
      </form>
    </div>
  );
}
