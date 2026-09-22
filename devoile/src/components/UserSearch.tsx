"use client";

import { useEffect, useState } from "react";

type UserResult = { id: string; username: string; firstName: string };

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.users);
        }
      } finally {
        setLoading(false);
      }
    }, 250); // debounce léger pendant la frappe ; se déclenche aussi au chargement (query vide → tout le monde)

    return () => clearTimeout(timeout);
  }, [query]);

  const trimmed = query.trim();

  return (
    <div className="space-y-4">
      <input
        className="input-field"
        placeholder="Prénom ou nom d'utilisateur..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />

      {loading && <p className="text-sm text-white/40">Chargement...</p>}

      {!loading && (
        <p className="text-sm text-white/40">
          {trimmed ? `${results.length} résultat${results.length > 1 ? "s" : ""}` : `${results.length} personne${results.length > 1 ? "s" : ""} au total`}
        </p>
      )}

      {!loading && trimmed && results.length === 0 && (
        <p className="text-sm text-white/40">Personne ne correspond à « {trimmed} ».</p>
      )}

      <ul className="space-y-2">
        {results.map((u) => (
          <li key={u.id} className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center font-bold text-ink shrink-0">
              {u.firstName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate">{u.firstName}</p>
              <p className="text-sm text-white/40 truncate">@{u.username}</p>
            </div>
          </div>
        ))}
      </ul>
    </div>
  );
}
