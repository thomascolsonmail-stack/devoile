"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type MemberItem = {
  id: string;
  userId: string;
  firstName: string;
};

export default function MembersList({
  groupId,
  members,
  ownerId,
  currentUserId,
  isOwner,
  countByUser
}: {
  groupId: string;
  members: MemberItem[];
  ownerId: string;
  currentUserId: string;
  isOwner: boolean;
  countByUser: Record<string, number>;
}) {
  const router = useRouter();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function removeMember(userId: string) {
    setError(null);
    setRemovingId(userId);
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Impossible de retirer ce membre.");
        return;
      }
      router.refresh();
    } finally {
      setRemovingId(null);
      setConfirmId(null);
    }
  }

  return (
    <div>
      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between text-sm gap-2">
            <span className="truncate">
              {m.firstName}
              {m.userId === ownerId && <span className="text-white/40"> · organisateur</span>}
            </span>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-white/40">{countByUser[m.userId] || 0} envoi(s)</span>
              {isOwner &&
                m.userId !== ownerId &&
                m.userId !== currentUserId &&
                (confirmId === m.userId ? (
                  <button
                    onClick={() => removeMember(m.userId)}
                    disabled={removingId === m.userId}
                    className="text-xs text-accent underline"
                  >
                    {removingId === m.userId ? "..." : "Confirmer"}
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmId(m.userId)}
                    className="text-xs text-white/30 hover:text-accent"
                    aria-label={`Retirer ${m.firstName} du groupe`}
                  >
                    Retirer
                  </button>
                ))}
            </div>
          </li>
        ))}
      </ul>
      {error && <p className="text-sm text-accent mt-2">{error}</p>}
    </div>
  );
}