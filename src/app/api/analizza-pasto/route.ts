import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { ALIMENTI, type Nutrienti } from "@/lib/nutrienti";
import type { VoceAlimento } from "@/lib/types";

const Per100 = z.object({
  kcal: z.number(),
  proteine: z.number(),
  carboidrati: z.number(),
  zuccheri: z.number(),
  grassi: z.number(),
  saturi: z.number(),
  fibra: z.number(),
  sodio: z.number(),
});

const Analisi = z.object({
  contiene_cibo: z.boolean(),
  descrizione: z.string(),
  alimenti: z.array(
    z.object({
      nome: z.string(),
      id_tabella: z.string().nullable(),
      grammi: z.number(),
      stima_per_100g: Per100.nullable(),
    }),
  ),
});

const ELENCO = ALIMENTI.map((a) => `${a.id} | ${a.nome}`).join("\n");

const SYSTEM = `Analizzi foto di pasti per un'app italiana sul benessere alimentare.

Per ogni alimento visibile nella foto:
- nome: nome in italiano, breve (es. "Pasta al pomodoro" diventa due voci: "Pasta cotta" e "Passata di pomodoro"; separa i condimenti visibili come olio o formaggio grattugiato).
- grammi: peso stimato della porzione come si vede nel piatto (cotto se è cotto). Usa riferimenti visivi come piatto, posate e mani.
- id_tabella: l'id dell'alimento corrispondente nella tabella qui sotto, scegliendo la forma giusta (cotto o crudo). Usa null se nessuna voce corrisponde davvero.
- stima_per_100g: solo quando id_tabella è null, i valori nutrizionali per 100 g (kcal, grammi di proteine, carboidrati disponibili, zuccheri, grassi, grassi saturi, fibra; sodio in mg). Altrimenti null.

descrizione: nome breve del pasto in italiano (es. "Pranzo: pasta al pomodoro e insalata").
Se la foto non contiene cibo, contiene_cibo è false e alimenti è vuoto.

Tabella alimenti (id | nome):
${ELENCO}`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { errore: "Il riconoscimento foto non è configurato: manca la chiave ANTHROPIC_API_KEY sul server." },
      { status: 503 },
    );
  }

  const { immagine } = (await req.json().catch(() => ({}))) as { immagine?: string };
  const m = immagine?.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/);
  if (!m) return Response.json({ errore: "Immagine non valida." }, { status: 400 });
  const mediaType = m[1] as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

  const client = new Anthropic();
  try {
    const risposta = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(Analisi) },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: m[2] } },
            { type: "text", text: "Riconosci gli alimenti e le porzioni di questo pasto." },
          ],
        },
      ],
    });

    if (risposta.stop_reason === "refusal" || !risposta.parsed_output) {
      return Response.json({ errore: "Non sono riuscito ad analizzare la foto. Riprova o inserisci il pasto a mano." }, { status: 422 });
    }
    const analisi = risposta.parsed_output;
    if (!analisi.contiene_cibo) {
      return Response.json({ errore: "Nella foto non vedo cibo." }, { status: 422 });
    }

    const perId = new Map(ALIMENTI.map((a) => [a.id, a]));
    const voci: VoceAlimento[] = analisi.alimenti.flatMap((a) => {
      const riga = a.id_tabella ? perId.get(a.id_tabella) : undefined;
      const per100: Nutrienti | null = riga
        ? { kcal: riga.kcal, proteine: riga.proteine, carboidrati: riga.carboidrati, zuccheri: riga.zuccheri, grassi: riga.grassi, saturi: riga.saturi, fibra: riga.fibra, sodio: riga.sodio }
        : a.stima_per_100g;
      if (!per100 || !(a.grammi > 0)) return [];
      return [{ nome: a.nome, grammi: Math.round(a.grammi), idTabella: riga ? riga.id : null, per100 }];
    });

    return Response.json({ descrizione: analisi.descrizione, voci });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      return Response.json({ errore: "La chiave ANTHROPIC_API_KEY non è valida." }, { status: 503 });
    }
    if (e instanceof Anthropic.RateLimitError) {
      return Response.json({ errore: "Troppe richieste, riprova tra poco." }, { status: 429 });
    }
    if (e instanceof Anthropic.APIError) {
      console.error("analizza-pasto", e.status, e.message);
      return Response.json({ errore: "Il servizio di analisi non risponde. Riprova più tardi." }, { status: 502 });
    }
    throw e;
  }
}
