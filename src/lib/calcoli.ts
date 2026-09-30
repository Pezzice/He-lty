// Calcoli basati sulla base di conoscenza del progetto (knowledge/).
import type { Condizione, LivelloAttivita, Obiettivo, Profilo } from "./types";

// PAL indicativi LARN/EFSA (knowledge/01-nutrizione/fabbisogni.md)
const PAL: Record<LivelloAttivita, number> = {
  sedentario: 1.4,
  moderato: 1.6,
  attivo: 1.8,
  molto_attivo: 2.0,
};

export const ETICHETTE_ATTIVITA: Record<LivelloAttivita, string> = {
  sedentario: "Sedentario",
  moderato: "Moderatamente attivo",
  attivo: "Attivo",
  molto_attivo: "Molto attivo",
};

export const ETICHETTE_OBIETTIVO: Record<Obiettivo, string> = {
  benessere: "Stare bene in generale",
  peso: "Raggiungere un peso sano",
  forma: "Migliorare la forma fisica",
  sonno_energia: "Dormire meglio e avere più energia",
};

// Profili speciali di knowledge/08-sicurezza/regole-app.md, sezione 2.
export const ETICHETTE_CONDIZIONE: Record<Condizione, string> = {
  diabete_farmaci: "Diabete con farmaci per la glicemia",
  ipertensione: "Pressione alta",
  renale: "Malattia renale cronica",
  scompenso: "Scompenso cardiaco",
  anticoagulanti: "Prendo anticoagulanti",
};

/** Condizioni in cui i liquidi li decide il medico: niente obiettivo d'acqua. */
export function liquidiDalMedico(p: Profilo): boolean {
  return p.restrizioneLiquidi || p.condizioni.includes("renale") || p.condizioni.includes("scompenso");
}

export function eta(p: Profilo, oggi = new Date()): number | null {
  return p.annoNascita ? oggi.getFullYear() - p.annoNascita : null;
}

export function profiloCompleto(p: Profilo): boolean {
  return Boolean(p.nome.trim() && p.annoNascita && p.sesso && p.pesoKg && p.altezzaCm);
}

/** Il benvenuto è finito quando ci sono i dati di base e il consenso. */
export function benvenutoCompletato(p: Profilo): boolean {
  return profiloCompleto(p) && p.consensoAt !== null;
}

/** Metabolismo basale, Mifflin-St Jeor. */
export function bmr(p: Profilo): number | null {
  const e = eta(p);
  if (!e || !p.sesso || !p.pesoKg || !p.altezzaCm) return null;
  const base = 10 * p.pesoKg + 6.25 * p.altezzaCm - 5 * e;
  return Math.round(p.sesso === "M" ? base + 5 : base - 161);
}

/**
 * Fabbisogno energetico giornaliero. Null quando il conteggio calorie
 * va disattivato (minori, disturbi alimentari: regole-app.md sez. 1-2).
 */
export function fabbisognoKcal(p: Profilo): number | null {
  const e = eta(p);
  if (p.disturbiAlimentari || (e !== null && e < 18)) return null;
  const b = bmr(p);
  return b ? Math.round((b * PAL[p.attivita]) / 10) * 10 : null;
}

/**
 * Obiettivo acqua da bevande in ml: 30 mL/kg (knowledge/02-idratazione),
 * +300 ml in gravidanza. Null con restrizione di liquidi prescritta dal medico.
 */
export function obiettivoAcquaMl(p: Profilo): number | null {
  if (liquidiDalMedico(p)) return null;
  let ml: number;
  if (p.pesoKg) ml = p.pesoKg * 30;
  else if (p.sesso) ml = p.sesso === "M" ? 2000 : 1600;
  else return null;
  if (p.gravidanza) ml += 300;
  return Math.round(ml / 50) * 50;
}

/** Proteine g/die: 0,9 g/kg adulti, 1,1 g/kg over 65, 1,4 g/kg se attivi. */
export function proteineG(p: Profilo): number | null {
  if (!p.pesoKg) return null;
  const e = eta(p);
  let gPerKg = 0.9;
  if (p.attivita === "attivo" || p.attivita === "molto_attivo") gPerKg = 1.4;
  else if (e !== null && e >= 65) gPerKg = 1.1;
  return Math.round(p.pesoKg * gPerKg);
}

/** Passi: ~8.000 sotto i 60 anni, ~7.000 dai 60 (Paluch 2022). */
export function obiettivoPassi(p: Profilo): number {
  const e = eta(p);
  return e !== null && e >= 60 ? 7000 : 8000;
}

/** OMS adulti: 150 min/settimana di attività moderata, cioè circa 22 al giorno. */
export const MINUTI_ATTIVITA_GIORNO = 22;
