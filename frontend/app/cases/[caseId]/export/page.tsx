export default async function ExportPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const href = `${api}/files/cases/${caseId}/export`;
  return (
    <section className="glass-panel panel-pad stack-sm">
      <h1>Export</h1>
      <p>Export ZIP, screenshots, and logs from this case.</p>
      <a href={href} target="_blank" rel="noreferrer">
        Download NIfTI export ZIP
      </a>
      <p className="muted-danger">
        Non-diagnostic research output. Not for clinical decision making.
      </p>
    </section>
  );
}
