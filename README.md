# HE@LTY

Prototipo web (PWA) di HE@LTY: raccoglie i dati giornalieri su acqua, pasti, movimento, sonno e integratori e dà suggerimenti generali sul benessere, basati sulle fonti della base di conoscenza del progetto (LARN, EFSA, OMS, AASM).

## Cosa c'è ora

- **Benvenuto** (al primo avvio): nome, anno di nascita, sesso, peso, altezza, attività, obiettivo, condizioni di salute, integratori e consenso ai dati sanitari, un passo alla volta.
- **Oggi**: acqua con obiettivo personale, minuti di attività e passi, pasti con calorie facoltative, ore di sonno, integratori da spuntare, suggerimenti del giorno con la fonte.
- **Foto del piatto**: Claude riconosce alimenti e porzioni, li abbina alla tabella di 153 alimenti comuni (valori USDA SR28 per 100 g) e compila la tabella nutrizionale del giorno. L'utente controlla e corregge i grammi prima di salvare.
- **Profilo**: dati di base, situazioni particolari (gravidanza, limite di liquidi, disturbi alimentari) che cambiano o nascondono i suggerimenti, obiettivi calcolati.
- **Storico**: ultimi 7 giorni e minuti di attività della settimana.
- Pulsante **"Non mi sento bene"** con i segnali d'allarme e il 112.

I dati restano nel browser (`localStorage`). Il passo successivo è Supabase: lo schema è pronto in `supabase/schema.sql`.

## Avvio in locale

```bash
npm install
cp .env.example .env.local   # inserisci la tua ANTHROPIC_API_KEY
npm run dev
```

Senza chiave l'app funziona, ma la foto del piatto risponde che il riconoscimento non è configurato.

Poi apri http://localhost:3000.

## Pubblicazione

Importa la repository su [Vercel](https://vercel.com/new) e aggiungi la variabile d'ambiente `ANTHROPIC_API_KEY`.

## Struttura

- `src/lib/calcoli.ts`: fabbisogni (Mifflin-St Jeor, PAL LARN, acqua 30 mL/kg, proteine, passi)
- `src/lib/consigli.ts`: regole dei suggerimenti e segnali d'allarme
- `src/app/api/analizza-pasto/route.ts`: analisi della foto con Claude
- `src/lib/nutrienti.ts` e `src/data/alimenti.json`: tabella alimenti
- `src/lib/archivio.ts`: salvataggio dei dati (da sostituire con Supabase)
- `src/app/`: pagine Oggi, Profilo, Storico

## Avvertenza

Prototipo per il benessere di adulti sani. Non fornisce diagnosi né indicazioni su farmaci e non è un dispositivo medico.
