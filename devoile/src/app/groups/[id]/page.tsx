import NotificationGate from "@/components/NotificationGate";
import NudgeButton from "@/components/NudgeButton";
import MembersList from "@/components/MembersList";
import DeleteGroupButton from "@/components/DeleteGroupButton";
import ChatToggle from "@/components/ChatToggle";
import GroupChat from "@/components/GroupChat";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Countdown from "@/components/Countdown";
import InviteCard from "@/components/InviteCard";
import AddMemberForm from "@/components/AddMemberForm";
import UploadArea from "@/components/UploadArea";
import MediaGrid, { MediaItem } from "@/components/MediaGrid";
import BlurPreview, { TeaserItem } from "@/components/BlurPreview";

export const dynamic = "force-dynamic";

export default async function GroupPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: {
      memberships: { include: { user: true }, orderBy: { joinedAt: "asc" } }
    }
  });
  if (!group) notFound();

  const isMember = group.memberships.some((m) => m.userId === user.id);
  if (!isMember) redirect("/dashboard");

  const revealed = group.revealAt.getTime() <= Date.now();
  const isOwner = group.ownerId === user.id;

  const totalMedia = await prisma.media.count({ where: { groupId: group.id } });
  const perUserCounts = await prisma.media.groupBy({
    by: ["uploaderId"],
    where: { groupId: group.id },
    _count: true
  });
  const countByUser = new Map(perUserCounts.map((c) => [c.uploaderId, c._count]));
  const countByUserObj = Object.fromEntries(countByUser);

  let mediaItems: MediaItem[] = [];
  let teaserItems: TeaserItem[] = [];
  if (!revealed) {
    const teaser = await prisma.media.findMany({
      where: { groupId: group.id },
      orderBy: { capturedAt: "asc" },
      select: { id: true, type: true, blurredUrl: true, uploader: { select: { firstName: true } } }
    });
    teaserItems = teaser.map((m) => ({
      id: m.id,
      type: m.type as "photo" | "video",
      blurredUrl: m.blurredUrl,
      uploaderName: m.uploader.firstName
    }));
  }
  if (revealed) {
    const media = await prisma.media.findMany({
      where: { groupId: group.id },
      orderBy: { capturedAt: "asc" },
      include: { uploader: true, reactions: true }
    });
    mediaItems = media.map((m) => {
      const byEmoji = new Map<string, { count: number; reactedByMe: boolean }>();
      for (const r of m.reactions) {
        const entry = byEmoji.get(r.emoji) || { count: 0, reactedByMe: false };
        entry.count += 1;
        if (r.userId === user.id) entry.reactedByMe = true;
        byEmoji.set(r.emoji, entry);
      }
      return {
        id: m.id,
        url: m.url,
        type: m.type as "photo" | "video",
        capturedAt: m.capturedAt.toISOString(),
        uploaderName: m.uploader.firstName,
        reactions: Array.from(byEmoji.entries()).map(([emoji, v]) => ({ emoji, ...v }))
      };
    });
  }

  return (
    <NotificationGate>
    <main className="min-h-screen pb-24">
      <div
        className="relative h-48 flex items-end p-6"
        style={
          group.wallpaperUrl
            ? { backgroundImage: `url(${group.wallpaperUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: "linear-gradient(135deg, #7c5cff, #ff5da2)" }
        }
      >
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-black/30 to-black/10" />
        <Link href="/dashboard" className="absolute top-6 left-6 text-white/80 text-sm z-10">
          ← Retour
        </Link>
        <h1 className="relative text-3xl font-bold z-10">{group.name}</h1>
      </div>

      <div className="px-6 -mt-6 relative z-10 space-y-5">
        <div className="card p-5 flex flex-col items-center gap-2">
          {!revealed ? (
            <>
              <p className="label">Révélation dans</p>
              <Countdown target={group.revealAt.toISOString()} />
            </>
          ) : (
            <p className="text-lg font-semibold text-gold">🎉 Les souvenirs sont révélés !</p>
          )}
        </div>

        <div className="card p-5">
          <p className="label mb-3">
            {group.memberships.length} membre{group.memberships.length > 1 ? "s" : ""} · {totalMedia} photo
            {totalMedia > 1 ? "s" : ""}
          </p>
          <MembersList
            groupId={group.id}
            members={group.memberships.map((m) => ({ id: m.id, userId: m.userId, firstName: m.user.firstName }))}
            ownerId={group.ownerId}
            currentUserId={user.id}
            isOwner={isOwner}
            countByUser={countByUserObj}
          />
        </div>

        {!revealed && <BlurPreview items={teaserItems} revealAt={group.revealAt.toISOString()} />}

        {!revealed && <UploadArea groupId={group.id} />}

        {!revealed && (
          <>
            <InviteCard inviteCode={group.inviteCode} />
            {isOwner && (
              <div className="card p-5">
                <p className="label mb-3">Ajouter par nom d&apos;utilisateur</p>
                <AddMemberForm groupId={group.id} />
              </div>
            )}
          </>
        )}

        {revealed && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="label">Galerie ({mediaItems.length})</p>
              <a href={`/api/groups/${group.id}/download`} className="btn-secondary text-sm py-2 px-4">
                ⬇️ Tout télécharger
              </a>
            </div>
            {mediaItems.length === 0 ? (
              <p className="text-white/50 text-sm">Personne n&apos;a ajouté de photo ou vidéo dans ce groupe.</p>
            ) : (
              <MediaGrid groupId={group.id} initialMedia={mediaItems} />
            )}
          </div>
        )}
        {group.chatEnabled && (
          <div className="card p-5 space-y-4">
            <p className="label">💬 Discussion</p>
            <GroupChat groupId={group.id} currentUserId={user.id} />
          </div>
        )}

        {!group.chatEnabled && !isOwner && (
          <div className="card p-5 text-sm text-white/40 text-center">
            Le chat est désactivé pour ce groupe.
          </div>
        )}

        {isOwner && (
          <div className="card p-5 space-y-5">
            <p className="label">Paramètres du groupe</p>
            <NudgeButton groupId={group.id} />
            <ChatToggle groupId={group.id} initialEnabled={group.chatEnabled} />
            <div className="border-t border-white/10 pt-4">
              <DeleteGroupButton groupId={group.id} groupName={group.name} />
            </div>
          </div>
        )}
      </div>
    </main>
    </NotificationGate>
  );
}
