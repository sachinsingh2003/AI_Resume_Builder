/** Consistent page header with title + optional right actions. */
export default function PageHeader({ title, subtitle, right, testId }) {
  return (
    <div className="border-b border-white/5">
      <div className="max-w-6xl px-8 py-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 data-testid={testId || "page-title"} className="font-display text-4xl font-black tracking-tighter">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-zinc-500 max-w-2xl">{subtitle}</p>}
        </div>
        {right}
      </div>
    </div>
  );
}
