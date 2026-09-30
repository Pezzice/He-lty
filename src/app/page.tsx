"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FotoPasto } from "@/components/FotoPasto";
import { Barra, Scheda } from "@/components/Scheda";
import { TabellaNutrienti } from "@/components/TabellaNutrienti";
import { oggiISO, useDiario, useProfilo } from "@/lib/archivio";
import { MINUTI_ATTIVITA_GIORNO, benvenutoCompletato, fabbisognoKcal, obiettivoAcquaMl, obiettivoPassi, proteineG } from "@/lib/calcoli";
import { SEGNALI_ALLARME, consigliDelGiorno } from "@/lib/consigli";
import { perGrammi, somma } from "@/lib/nutrienti";
import type { VoceAlimento } from "@/lib/types";

function numero(v: string): number | null {
  const n = Number(v.replace(",", "."));
  return v.trim() === "" || Number.isNaN(n) ? null : n;
}

export default function Oggi() {
  const { profilo, pronto: profiloPronto } = useProfilo();
  const { giorno, aggiorna, pronto: diarioPronto } = useDiario();
  const [allarme, setAllarme] = useState(false);
  const [pasto, setPasto] = useState({ descrizione: "", kcal: "" });
  const router = useRouter();
  const daAccogliere = profiloPronto && !benvenutoCompletato(profilo);

  useEffect(() => {
    if (daAccogliere) router.replace("/benvenuto");
  }, [daAccogliere, router]);

  if (!profiloPronto || !diarioPronto || daAccogliere) return null;

  const data = oggiISO();
  const g = giorno(data);
  const acqua = obiettivoAcquaMl(profilo);
  const kcal = fabbisognoKcal(profilo);
  const proteine = proteineG(profilo);
  const passi = obiettivoPassi(profilo);
  const consigli = consigliDelGiorno(profilo, g);
  const kcalOggi = g.pasti.reduce((s, p) => s + (p.kcal ?? 0), 0);
  const vociOggi = g.pasti.flatMap((p) => p.alimenti ?? []);
  const nutrientiOggi = somma(vociOggi.map((v) => perGrammi(v.per100, v.grammi)));

  const salvaPastoFoto = (descrizione: string, voci: VoceAlimento[]) => {
    const ora = new Date().toTimeString().slice(0, 5);
    const kcalPasto = Math.round(somma(voci.map((v) => perGrammi(v.per100, v.grammi))).kcal);
    aggiorna(data, (d) => ({
      ...d,
      pasti: [...d.pasti, { id: crypto.randomUUID(), ora, descrizione, kcal: kcalPasto, alimenti: voci }],
    }));
  };

  const aggiungiPasto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasto.descrizione.trim()) return;
    const ora = new Date().toTimeString().slice(0, 5);
    aggiorna(data, (d) => ({
      ...d,
      pasti: [...d.pasti, { id: crypto.randomUUID(), ora, descrizione: pasto.descrizione.trim(), kcal: numero(pasto.kcal) }],
    }));
    setPasto({ descrizione: "", kcal: "" });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">
          {profilo.nome ? `Ciao ${profilo.nome}` : "Oggi"}
        </h1>
        <p className="text-sm text-muted">
          {new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {allarme ? (
        <div className="rounded-2xl border-2 border-danger bg-card p-4">
          <p className="font-semibold text-danger">Se hai uno di questi sintomi chiama subito il 112:</p>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {SEGNALI_ALLARME.map((s) => <li key={s}>{s}</li>)}
          </ul>
          <p className="mt-2 text-sm">Per pensieri di farti del male: 112 o Telefono Amico 02 2327 2327.</p>
          <a href="tel:112" className="mt-3 inline-block rounded-full bg-danger px-4 py-2 text-sm font-medium text-white">Chiama il 112</a>
          <button onClick={() => setAllarme(false)} className="ml-3 text-sm text-muted underline">Chiudi</button>
        </div>
      ) : (
        <button onClick={() => setAllarme(true)} className="self-start text-sm text-danger underline">
          Non mi sento bene
        </button>
      )}

      <Scheda titolo="Suggerimenti di oggi">
        {consigli.length === 0 ? (
          <p className="text-sm text-muted">Tutto in linea per ora. Continua così.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {consigli.map((c, i) => (
              <li key={i} className="text-sm">
                {c.area === "profilo" ? <Link href="/profilo" className="text-accent underline">{c.testo}</Link> : c.testo}
                {c.fonte && <span className="block text-xs text-muted">Fonte: {c.fonte}</span>}
              </li>
            ))}
          </ul>
        )}
      </Scheda>

      <Scheda titolo="Acqua" extra={<span className="text-sm text-muted">{g.acquaMl} ml{acqua ? ` / ${acqua}` : ""}</span>}>
        {acqua && <Barra valore={g.acquaMl} obiettivo={acqua} colore="bg-water" />}
        <div className="mt-3 flex gap-2">
          {[250, 500].map((ml) => (
            <button key={ml} onClick={() => aggiorna(data, (d) => ({ ...d, acquaMl: d.acquaMl + ml }))}
              className="rounded-full bg-accent-soft px-4 py-2 text-sm font-medium text-accent">+{ml} ml</button>
          ))}
          <button onClick={() => aggiorna(data, (d) => ({ ...d, acquaMl: Math.max(0, d.acquaMl - 250) }))}
            className="rounded-full border border-line px-4 py-2 text-sm text-muted">−250</button>
        </div>
      </Scheda>

      <Scheda titolo="Movimento">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label>
            Minuti di attività
            <input type="number" inputMode="numeric" min={0} value={g.minutiAttivita || ""}
              onChange={(e) => aggiorna(data, (d) => ({ ...d, minutiAttivita: numero(e.target.value) ?? 0 }))} />
          </label>
          <label>
            Passi
            <input type="number" inputMode="numeric" min={0} value={g.passi ?? ""}
              onChange={(e) => aggiorna(data, (d) => ({ ...d, passi: numero(e.target.value) }))} />
          </label>
        </div>
        <div className="mt-3 flex flex-col gap-2 text-xs text-muted">
          <span>Attività: {g.minutiAttivita} / {MINUTI_ATTIVITA_GIORNO} min</span>
          <Barra valore={g.minutiAttivita} obiettivo={MINUTI_ATTIVITA_GIORNO} />
          <span>Passi: {g.passi ?? 0} / {passi}</span>
          <Barra valore={g.passi ?? 0} obiettivo={passi} />
        </div>
      </Scheda>

      <Scheda titolo="Pasti" extra={kcal ? <span className="text-sm text-muted">{kcalOggi} / {kcal} kcal</span> : null}>
        {proteine && <p className="mb-2 text-xs text-muted">Obiettivo proteine: circa {proteine} g al giorno.</p>}
        <ul className="mb-3 flex flex-col gap-1 text-sm">
          {g.pasti.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2">
              <span>
                <span className="text-muted">{p.ora}</span> {p.descrizione}{kcal && p.kcal ? ` · ${p.kcal} kcal` : ""}
                {p.alimenti && (
                  <span className="block text-xs text-muted">{p.alimenti.map((a) => `${a.nome} ${a.grammi} g`).join(", ")}</span>
                )}
              </span>
              <button aria-label="Elimina" onClick={() => aggiorna(data, (d) => ({ ...d, pasti: d.pasti.filter((x) => x.id !== p.id) }))}
                className="text-muted">×</button>
            </li>
          ))}
        </ul>
        <div className="mb-3">
          <FotoPasto mostraKcal={kcal !== null} onSalva={salvaPastoFoto} />
        </div>
        <form onSubmit={aggiungiPasto} className="flex gap-2">
          <input placeholder="Cosa hai mangiato?" value={pasto.descrizione}
            onChange={(e) => setPasto({ ...pasto, descrizione: e.target.value })} />
          {kcal && (
            <input className="max-w-24" placeholder="kcal" inputMode="numeric" value={pasto.kcal}
              onChange={(e) => setPasto({ ...pasto, kcal: e.target.value })} />
          )}
          <button className="rounded-lg bg-accent px-4 text-sm font-medium text-white">Aggiungi</button>
        </form>
      </Scheda>

      {vociOggi.length > 0 && (
        <Scheda titolo="Nutrienti di oggi">
          <TabellaNutrienti totale={nutrientiOggi} kcalObiettivo={kcal} proteineObiettivo={proteine} />
          {g.pasti.some((p) => !p.alimenti) && (
            <p className="mt-2 text-xs text-muted">Conta solo i pasti fotografati.</p>
          )}
        </Scheda>
      )}

      <Scheda titolo="Sonno">
        <label className="text-sm">
          Ore dormite stanotte
          <input type="number" inputMode="decimal" step={0.5} min={0} max={24} value={g.oreSonno ?? ""}
            onChange={(e) => aggiorna(data, (d) => ({ ...d, oreSonno: numero(e.target.value) }))} />
        </label>
      </Scheda>

      {profilo.integratori.length > 0 && (
        <Scheda titolo="Integratori">
          <ul className="flex flex-col gap-2 text-sm">
            {profilo.integratori.map((nome) => (
              <li key={nome}>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={g.integratoriPresi.includes(nome)}
                    onChange={(e) => aggiorna(data, (d) => ({
                      ...d,
                      integratoriPresi: e.target.checked ? [...d.integratoriPresi, nome] : d.integratoriPresi.filter((x) => x !== nome),
                    }))} />
                  {nome}
                </label>
              </li>
            ))}
          </ul>
        </Scheda>
      )}
    </div>
  );
}
