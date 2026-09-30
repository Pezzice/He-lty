"use client";
// Archivio locale nel browser. Sarà sostituito da Supabase (supabase/schema.sql)
// quando il progetto avrà le sue chiavi: le pagine usano solo queste funzioni.
import { useCallback, useSyncExternalStore } from "react";
import { type GiornoDiario, type Profilo, PROFILO_VUOTO, giornoVuoto } from "./types";

type Diario = Record<string, GiornoDiario>;

function creaArchivio<T>(chiave: string, predefinito: T) {
  let cache: T | undefined;
  const ascoltatori = new Set<() => void>();

  const leggi = (): T => {
    if (cache === undefined) {
      try {
        const raw = localStorage.getItem(chiave);
        cache = raw ? { ...predefinito, ...JSON.parse(raw) } : predefinito;
      } catch {
        cache = predefinito;
      }
    }
    return cache as T;
  };

  const scrivi = (valore: T) => {
    cache = valore;
    try {
      localStorage.setItem(chiave, JSON.stringify(valore));
    } catch {
      // archivio non disponibile (navigazione privata): i dati restano in memoria
    }
    ascoltatori.forEach((a) => a());
  };

  const iscrivi = (a: () => void) => {
    ascoltatori.add(a);
    return () => ascoltatori.delete(a);
  };

  return { leggi, scrivi, iscrivi };
}

const archivioProfilo = creaArchivio<Profilo>("helty.profilo", PROFILO_VUOTO);
const archivioDiario = creaArchivio<Diario>("helty.diario", {});

export function oggiISO(d = new Date()): string {
  const locale = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return locale.toISOString().slice(0, 10);
}

/** Sul server non c'è archivio: le pagine aspettano il browser (pronto=false). */
function useArchivio<T>(a: ReturnType<typeof creaArchivio<T>>) {
  return useSyncExternalStore(a.iscrivi, a.leggi, () => null);
}

export function useProfilo() {
  const profilo = useArchivio(archivioProfilo);
  const salva = useCallback((p: Profilo) => archivioProfilo.scrivi(p), []);
  return { profilo: profilo ?? PROFILO_VUOTO, salva, pronto: profilo !== null };
}

export function useDiario() {
  const diario = useArchivio(archivioDiario);
  const giorno = useCallback((data: string) => diario?.[data] ?? giornoVuoto(data), [diario]);
  const aggiorna = useCallback((data: string, modifica: (g: GiornoDiario) => GiornoDiario) => {
    const prev = archivioDiario.leggi();
    archivioDiario.scrivi({ ...prev, [data]: modifica(prev[data] ?? giornoVuoto(data)) });
  }, []);
  return { diario: diario ?? {}, giorno, aggiorna, pronto: diario !== null };
}
