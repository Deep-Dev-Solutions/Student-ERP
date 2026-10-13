interface ChartDataTableProps {
  caption: string;
  columns: string[];
  rows: (string | number)[][];
}

/** The chart's values as a table, so nothing is reachable only by hovering. */
export function ChartDataTable({ caption, columns, rows }: ChartDataTableProps) {
  return (
    <details className="group text-sm">
      <summary className="w-fit cursor-pointer rounded text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40">
        Show data as table
      </summary>
      <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-border">
        <table className="w-full tabular-nums">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
            <tr>
              {columns.map((c, i) => (
                <th key={c} scope="col" className={`px-3 py-2 font-medium ${i === 0 ? "text-left" : "text-right"}`}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row[0])} className="border-t border-border">
                {row.map((cell, i) => (
                  <td key={i} className={`px-3 py-1.5 ${i === 0 ? "text-left" : "text-right"}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
