export type Sesso = "M" | "F";
export type LivelloAttivita = "sedentario" | "moderato" | "attivo" | "molto_attivo";
export type Obiettivo = "benessere" | "peso" | "forma" | "sonno_energia";
export type Condizione = "diabete_farmaci" | "renale" | "scompenso" | "anticoagulanti" | "ipertensione";

export interface Profilo {
  nome: string;
  annoNascita: number | null;
  sesso: Sesso | null;
  pesoKg: number | null;
  altezzaCm: number | null;
  attivita: LivelloAttivita;
  obiettivo: Obiettivo;
  condizioni: Condizione[];
  integratori: string[];
  // Profili speciali (knowledge/08-sicurezza/regole-app.md, sezione 2)
  gravidanza: boolean;
  restrizioneLiquidi: boolean;
  disturbiAlimentari: boolean;
  /** Consenso esplicito al trattamento dei dati sanitari (GDPR art. 9), ISO. */
  consensoAt: string | null;
}

export interface Pasto {
  id: string;
  ora: string;
  descrizione: string;
  kcal: number | null;
}

export interface GiornoDiario {
  data: string; // YYYY-MM-DD
  acquaMl: number;
  pasti: Pasto[];
  minutiAttivita: number;
  passi: number | null;
  oreSonno: number | null;
  integratoriPresi: string[];
}

export const PROFILO_VUOTO: Profilo = {
  nome: "",
  annoNascita: null,
  sesso: null,
  pesoKg: null,
  altezzaCm: null,
  attivita: "moderato",
  obiettivo: "benessere",
  condizioni: [],
  integratori: [],
  gravidanza: false,
  restrizioneLiquidi: false,
  disturbiAlimentari: false,
  consensoAt: null,
};

export function giornoVuoto(data: string): GiornoDiario {
  return { data, acquaMl: 0, pasti: [], minutiAttivita: 0, passi: null, oreSonno: null, integratoriPresi: [] };
}
