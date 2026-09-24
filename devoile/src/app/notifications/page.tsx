import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return `il y a ${days} j`;
}

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const notifications = await prisma.notificationLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  await prisma.notificationLog.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true }
  });

  return (
    <main className="min-h-screen pb-24 px-6 pt-8">
      <Link href="/dashboard" className="text-white/60 text-sm">
        ← Retour
      </Link>
      <h1 className="text-2xl font-bold mt-3 mb-6">Notifications</h1>

      {notifications.length === 0 ? (
        <p className="text-white/50 text-sm">Aucune notification pour l&apos;instant.</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li key={n.id}>
              <Link
                href={n.url || "/dashboard"}
                className={`card p-4 block ${!n.read ? "border border-accent2/40" : ""}`}
              >
                <p className="font-semibold text-sm">{n.title}</p>
                <p className="text-sm text-white/60 mt-0.5">{n.body}</p>
                <p className="text-xs text-white/30 mt-1">{timeAgo(n.createdAt.toISOString())}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}