import { fetchCases } from "../../lib/api";
import Link from "next/link";

export default async function CasesPage() {
  const cases = await fetchCases();
  return (
    <section className="glass-panel" style={{ padding: "1rem" }}>
      <h1>Case Library</h1>
      <p>{cases.length} case(s)</p>
      <ul>
        {cases.map((item) => (
          <li key={item.id} style={{ marginBottom: "0.6rem" }}>
            <strong>{item.label}</strong> - {item.status} - {item.modalities.join(", ") || "no modalities"} {" "}
            <Link href={`/cases/${item.id}`}>Open</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
