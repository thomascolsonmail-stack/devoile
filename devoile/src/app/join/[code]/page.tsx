import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function JoinPage({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();
  const group = await prisma.group.findUnique({ where: { inviteCode: code } });

  if (!group) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 bg-brand-gradient">
        <div className="card p-8 text-center max-w-sm">
          <p className="text-3xl mb-2">🙈</p>
          <h1 className="text-xl font-bold mb-2">Code invalide</h1>
          <p className="text-white/50 text-sm mb-6">Ce lien ou code d&apos;invitation n&apos;existe plus.</p>
          <Link href="/dashboard" className="btn-primary w-full">
            Retour
          </Link>
        </div>
      </main>
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    const next = `/join/${code}`;
    return (
      <main className="min-h-screen flex items-center justify-center px-6 bg-brand-gradient">
        <div className="card p-8 text-center max-w-sm">
          <p className="text-3xl mb-2">🎁</p>
          <h1 className="text-xl font-bold mb-2">Rejoindre &laquo;&nbsp;{group.name}&nbsp;&raquo;</h1>
          <p className="text-white/50 text-sm mb-6">Connecte-toi ou crée un compte pour rejoindre ce groupe.</p>
          <div className="flex flex-col gap-3">
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="btn-primary w-full">
              Se connecter
            </Link>
            <Link href={`/signup?next=${encodeURIComponent(next)}`} className="btn-secondary w-full">
              Créer un compte
            </Link>
          </div>
        </div>
      </main>
    );
  }

  await prisma.membership.upsert({
    where: { userId_groupId: { userId: user.id, groupId: group.id } },
    create: { userId: user.id, groupId: group.id },
    update: {}
  });

  redirect(`/groups/${group.id}`);
}
