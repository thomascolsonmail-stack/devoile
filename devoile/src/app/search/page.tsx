import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import UserSearch from "@/components/UserSearch";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen pb-24 px-6 pt-8">
      <Link href="/dashboard" className="text-white/60 text-sm">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold mt-3 mb-6">Rechercher des gens</h1>
      <UserSearch />
    </main>
  );
}