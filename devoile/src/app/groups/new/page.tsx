import Link from "next/link";
import CreateGroupForm from "@/components/CreateGroupForm";

export default function NewGroupPage() {
  return (
    <main className="min-h-screen px-6 py-8 max-w-md mx-auto">
      <Link href="/dashboard" className="text-white/50 text-sm">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold mt-4 mb-6">Nouveau groupe</h1>
      <div className="card p-6">
        <CreateGroupForm />
      </div>
    </main>
  );
}
