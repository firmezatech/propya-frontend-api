'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Search, UserRound, X } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { getAdminUsers } from '../../admin-users/services/fmz-admin-users-api';
import type { FmzAdminEmailRecipient } from '../domain/fmz-admin-emails.types';

type Props = {
  selected: FmzAdminEmailRecipient[];
  onSelect: (recipients: FmzAdminEmailRecipient[]) => void;
};

const DEBOUNCE_MS = 350;
const MIN_RESULTS_LIMIT = 30;

export function FmzRecipientSelector({ selected, onSelect }: Props) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<FmzAdminEmailRecipient[]>([]);
  const [loading, setLoading]   = useState(false);
  const debounceRef             = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchGenerationRef      = useRef(0);

  const fetchUsers = useCallback(async (search: string) => {
    const generation = ++fetchGenerationRef.current;
    setLoading(true);
    try {
      const { items } = await getAdminUsers({ search, limit: MIN_RESULTS_LIMIT });
      if (generation !== fetchGenerationRef.current) return;
      setResults(
        items
          .filter((u) => u.email)
          .map((u) => ({ id: u.id, name: u.name, email: u.email })),
      );
    } catch {
      if (generation !== fetchGenerationRef.current) return;
      setResults([]);
    } finally {
      if (generation === fetchGenerationRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { void fetchUsers(query); }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchUsers]);

  const selectedIds = new Set(selected.map((r) => r.id));

  const toggle = (recipient: FmzAdminEmailRecipient) => {
    if (selectedIds.has(recipient.id)) {
      onSelect(selected.filter((r) => r.id !== recipient.id));
    } else {
      onSelect([...selected, recipient]);
    }
  };

  const remove = (id: string) => {
    onSelect(selected.filter((r) => r.id !== id));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Search input */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fmz-neutral-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-fmz-neutral-100 placeholder-fmz-neutral-500 outline-none focus:border-fmz-teal/50 focus:ring-1 focus:ring-fmz-teal/30"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-fmz-neutral-400" />
        )}
      </div>

      {/* Results list */}
      {results.length > 0 && (
        <ul className="max-h-52 overflow-y-auto rounded-xl border border-white/10 bg-fmz-navy-800">
          {results.map((user) => {
            const isSelected = selectedIds.has(user.id);
            return (
              <li key={user.id}>
                <button
                  type="button"
                  onClick={() => toggle(user)}
                  className={fmzCn(
                    'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                    isSelected
                      ? 'bg-fmz-teal/15 text-fmz-teal'
                      : 'text-fmz-neutral-200 hover:bg-white/5',
                  )}
                >
                  <UserRound className="h-4 w-4 shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="block truncate font-medium">{user.name || user.email}</span>
                    {user.name && (
                      <span className="block truncate text-xs text-fmz-neutral-400">{user.email}</span>
                    )}
                  </span>
                  {isSelected && (
                    <span className="shrink-0 text-xs font-medium">✓</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((r) => (
            <span
              key={r.id}
              className="flex items-center gap-1.5 rounded-full bg-fmz-teal/15 px-3 py-1 text-xs text-fmz-teal"
            >
              {r.name || r.email}
              <button
                type="button"
                onClick={() => remove(r.id)}
                aria-label={`Remover ${r.name || r.email}`}
                className="rounded-full hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {selected.length === 0 && !loading && results.length === 0 && !query && (
        <p className="text-center text-xs text-fmz-neutral-500">
          Digite para buscar destinatários.
        </p>
      )}
    </div>
  );
}
