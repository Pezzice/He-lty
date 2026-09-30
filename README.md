# HE@LTY

Prototipo web (PWA) di HE@LTY: raccoglie i dati giornalieri su acqua, pasti, movimento, sonno e integratori e dà suggerimenti generali sul benessere, basati sulle fonti della base di conoscenza del progetto (LARN, EFSA, OMS, AASM).

## Cosa c'è ora

- **Oggi**: acqua con obiettivo personale, minuti di attività e passi, pasti con calorie facoltative, ore di sonno, integratori da spuntare, suggerimenti del giorno con la fonte.
- **Profilo**: dati di base, situazioni particolari (gravidanza, limite di liquidi, disturbi alimentari) che cambiano o nascondono i suggerimenti, obiettivi calcolati.
- **Storico**: ultimi 7 giorni e minuti di attività della settimana.
- Pulsante **"Non mi sento bene"** con i segnali d'allarme e il 112.

I dati restano nel browser (`localStorage`). Il passo successivo è Supabase: lo schema è pronto in `supabase/schema.sql`.

## Avvio in locale

```bash
npm install
npm run dev
```

Poi apri http://localhost:3000.

## Pubblicazione

Importa la repository su [Vercel](https://vercel.com/new): nessuna configurazione necessaria.

## Struttura

- `src/lib/calcoli.ts`: fabbisogni (Mifflin-St Jeor, PAL LARN, acqua 30 mL/kg, proteine, passi)
- `src/lib/consigli.ts`: regole dei suggerimenti e segnali d'allarme
- `src/lib/archivio.ts`: salvataggio dei dati (da sostituire con Supabase)
- `src/app/`: pagine Oggi, Profilo, Storico

## Avvertenza

Prototipo per il benessere di adulti sani. Non fornisce diagnosi né indicazioni su farmaci e non è un dispositivo medico.
