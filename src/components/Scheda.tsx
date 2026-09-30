export function Scheda({ titolo, children, extra }: { titolo: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">{titolo}</h2>
        {extra}
      </div>
      {children}
    </section>
  );
}

export function Barra({ valore, obiettivo, colore = "bg-accent" }: { valore: number; obiettivo: number; colore?: string }) {
  const pct = obiettivo > 0 ? Math.min(100, Math.round((valore / obiettivo) * 100)) : 0;
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${colore}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
