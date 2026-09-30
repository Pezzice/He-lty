// Suggerimenti giornalieri a regole. Linguaggio da "suggerimento", mai
// prescrizione, e nessun consiglio su farmaci (knowledge/08-sicurezza/regole-app.md).
import {
  MINUTI_ATTIVITA_GIORNO,
  eta,
  obiettivoAcquaMl,
  obiettivoPassi,
  profiloCompleto,
} from "./calcoli";
import type { GiornoDiario, Profilo } from "./types";

export interface Consiglio {
  area: "idratazione" | "attivita" | "alimentazione" | "sonno" | "integratori" | "profilo";
  testo: string;
  fonte: string;
}

export function consigliDelGiorno(p: Profilo, g: GiornoDiario, ora = new Date()): Consiglio[] {
  const out: Consiglio[] = [];
  const h = ora.getHours();

  if (!profiloCompleto(p)) {
    out.push({
      area: "profilo",
      testo: "Completa il profilo (età, sesso, peso, altezza) per avere obiettivi personalizzati.",
      fonte: "",
    });
  }

  const acqua = obiettivoAcquaMl(p);
  if (p.restrizioneLiquidi) {
    out.push({
      area: "idratazione",
      testo: "Hai indicato una restrizione di liquidi: segui il limite indicato dal tuo medico.",
      fonte: "knowledge/02-idratazione",
    });
  } else if (acqua) {
    // Quota attesa in proporzione alle ore di veglia (8-22).
    const quota = Math.min(1, Math.max(0, (h - 8) / 14));
    if (g.acquaMl < acqua * quota - 500) {
      out.push({
        area: "idratazione",
        testo: `Sei un po' indietro con l'acqua: ${g.acquaMl} ml su ${acqua}. Un bicchiere ora aiuta.`,
        fonte: "EFSA 2010, knowledge/02-idratazione",
      });
    }
  }

  const passi = obiettivoPassi(p);
  if (h >= 16 && g.minutiAttivita < MINUTI_ATTIVITA_GIORNO && (g.passi ?? 0) < passi) {
    out.push({
      area: "attivita",
      testo: `Oggi ti manca ancora un po' di movimento: una camminata di 20 minuti ti porta vicino all'obiettivo OMS.`,
      fonte: "OMS 2020, knowledge/03-attivita-fisica",
    });
  }

  if (h >= 14 && g.pasti.length === 0 && !p.disturbiAlimentari) {
    out.push({
      area: "alimentazione",
      testo: "Non hai ancora registrato pasti oggi. Prova il piatto sano: metà verdura e frutta, un quarto cereali integrali, un quarto proteine.",
      fonte: "CREA 2018, knowledge/01-nutrizione",
    });
  }

  if (g.oreSonno !== null && g.oreSonno < 7) {
    const e = eta(p);
    out.push({
      area: "sonno",
      testo: `Hai dormito ${g.oreSonno} ore: per ${e !== null && e >= 65 ? "gli over 65 servono 7-8" : "un adulto servono 7-9"} ore. Stasera prova ad anticipare di mezz'ora.`,
      fonte: "AASM/SRS 2015, knowledge/04-sonno",
    });
  }

  const mancanti = p.integratori.filter((i) => !g.integratoriPresi.includes(i));
  if (h >= 20 && mancanti.length > 0) {
    out.push({
      area: "integratori",
      testo: `Non hai segnato: ${mancanti.join(", ")}.`,
      fonte: "",
    });
  }

  return out;
}

/** Segnali d'allarme: l'app smette di consigliare e indirizza al 112 (regole-app.md sez. 1). */
export const SEGNALI_ALLARME = [
  "Dolore o oppressione al petto",
  "Svenimento, confusione o difficoltà a parlare",
  "Viso asimmetrico o debolezza di un lato del corpo",
  "Mancanza di respiro a riposo",
  "Palpitazioni con capogiro",
];
