import Link from "next/link";
import NewCaseForm from "components/NewCaseForm";

export default function NewCasePage() {
  return (
    <section className="glass-panel panel-pad stack-md">
      <h1>New Case</h1>
      <p>Create a case now. Upload flow comes next in this build sequence.</p>
      <NewCaseForm />
      <Link href="/cases">Back to cases</Link>
    </section>
  );
}
