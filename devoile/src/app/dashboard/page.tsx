import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import LogoutButton from "@/components/LogoutButton";
import Countdown from "@/components/Countdown";
import JoinByCodeForm from "@/components/JoinByCodeForm";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: {
      group: {
        include: {
          _count: { select: { memberships: true, media: true } }
        }
      }
    },
    orderBy: { group: { revealAt: "asc" } }
  });

  return (
    <main className="min-h-screen pb-24 pt-8">
      {/* EN-TÊTE */}
      <div className="px-6 flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Mes Groupes</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="w-10 h-10 rounded-full bg-panel2 border border-white/10 flex items-center justify-center text-lg"
            aria-label="Rechercher des gens"
          >
            🔍
          </Link>
          <LogoutButton />
        </div>
      </div>

      {/* REJOINDRE UN GROUPE */}
      <div className="px-6 mb-6">
        <div className="card p-4">
          <p className="label mb-2">Rejoindre avec un code</p>
          <JoinByCodeForm />
        </div>
      </div>

      {/* LISTE DES GROUPES */}
      <div className="px-6 space-y-4">
        {memberships.length === 0 && (
          <div className="card p-8 text-center text-white/50">
            <p className="text-3xl mb-2">📸</p>
            <p>Tu n&apos;as encore aucun groupe.</p>
            <p className="text-sm mt-1">Crée-en un ou rejoins-en un avec un code d&apos;invitation.</p>
          </div>
        )}

        {memberships.map(({ group }) => (
          <Link
            key={group.id}
            href={`/groups/${group.id}`}
            className="card relative flex items-end overflow-hidden h-36 p-5"
            style={
              group.wallpaperUrl
                ? { backgroundImage: `url(${group.wallpaperUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                : undefined
            }
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="relative w-full flex items-end justify-between">
              <div>
                <h2 className="font-bold text-lg">{group.name}</h2>
                <p className="text-xs text-white/60 mt-1">
                  {group._count.memberships} membre{group._count.memberships > 1 ? "s" : ""} · {group._count.media} photo
                  {group._count.media > 1 ? "s" : ""}
                </p>
              </div>
              <Countdown target={group.revealAt.toISOString()} compact />
            </div>
          </Link>
        ))}
      </div>

      {/* BOUTON FLOTTANT + */}
      <Link
        href="/groups/new"
        className="fixed bottom-6 right-6 btn-primary rounded-full w-16 h-16 text-2xl shadow-2xl flex items-center justify-center pb-1"
        aria-label="Créer un groupe"
      >
        +
      </Link>
    </main>
  );
}