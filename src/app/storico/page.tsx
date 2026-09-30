"use client";
import { Barra, Scheda } from "@/components/Scheda";
import { oggiISO, useDiario, useProfilo } from "@/lib/archivio";
import { obiettivoAcquaMl } from "@/lib/calcoli";

export default function Storico() {
  const { profilo, pronto: p1 } = useProfilo();
  const { giorno, pronto: p2 } = useDiario();
  if (!p1 || !p2) return null;

  const acqua = obiettivoAcquaMl(profilo);
  const giorni = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return { data: d, g: giorno(oggiISO(d)) };
  });
  const minutiSettimana = giorni.reduce((s, x) => s + x.g.minutiAttivita, 0);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Ultimi 7 giorni</h1>
      <Scheda titolo="Attività della settimana" extra={<span className="text-sm text-muted">{minutiSettimana} / 150 min</span>}>
        <Barra valore={minutiSettimana} obiettivo={150} />
      </Scheda>
      {giorni.map(({ data, g }) => (
        <Scheda key={g.data} titolo={data.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "short" })}>
          <dl className="grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-muted">Acqua</dt><dd>{g.acquaMl} ml{acqua ? ` / ${acqua}` : ""}</dd>
            <dt className="text-muted">Attività</dt><dd>{g.minutiAttivita} min</dd>
            <dt className="text-muted">Passi</dt><dd>{g.passi ?? "–"}</dd>
            <dt className="text-muted">Sonno</dt><dd>{g.oreSonno !== null ? `${g.oreSonno} h` : "–"}</dd>
            <dt className="text-muted">Pasti</dt><dd>{g.pasti.length}</dd>
          </dl>
        </Scheda>
      ))}
    </div>
  );
}
