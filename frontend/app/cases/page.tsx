import { fetchCases, CaseItem } from "../../lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  let cases: CaseItem[] = [];
  try {
    cases = await fetchCases();
  } catch {
    return (
      <section className="glass-panel panel-pad stack-sm" style={{ textAlign: "center", padding: "3rem" }}>
        <h2>⏳ Waiting for backend…</h2>
        <p>Cannot reach <code>localhost:8000</code>. Start the backend first, then refresh.</p>
      </section>
    );
  }

  return (
    <section className="glass-panel panel-pad stack-sm">
      <h1>Case Library</h1>
      <p>{cases.length} case(s)</p>
      <ul>
        {cases.map((item) => (
          <li key={item.id} className="list-row">
            <strong>{item.label}</strong> — {item.status} — {item.modalities.join(", ") || "no modalities"}{" "}
            <Link href={`/cases/${item.id}`}>Open</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
