'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Building2, Loader2, Plus, Search, Users, UserRound, X } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { getAdminUsers } from '../../admin-users/services/fmz-admin-users-api';
import type { FmzAdminEmailRecipient } from '../domain/fmz-admin-emails.types';

type Props = {
  selected: FmzAdminEmailRecipient[];
  onSelect: (recipients: FmzAdminEmailRecipient[]) => void;
};

type RecipientTab = 'usuario' | 'imovel' | 'plataforma';

const TABS: { value: RecipientTab; label: string }[] = [
  { value: 'usuario',    label: 'Por usuário' },
  { value: 'imovel',     label: 'Por imóvel' },
  { value: 'plataforma', label: 'Plataforma' },
];

const DEBOUNCE_MS = 350;
const SEARCH_LIMIT = 30;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ─── Chips shared helper ──────────────────────────────────────────────────────

function RecipientChips({
  recipients,
  onRemove,
  max = 6,
}: {
  recipients: FmzAdminEmailRecipient[];
  onRemove: (id: string) => void;
  max?: number;
}) {
  if (!recipients.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {recipients.slice(0, max).map((r) => (
        <span
          key={r.id}
          className="flex items-center gap-1 rounded-full bg-[#0D1321]/10 px-2.5 py-1 text-xs font-medium text-fmz-navy"
        >
          <span className="max-w-[120px] truncate">{r.name || r.email}</span>
          <button
            type="button"
            onClick={() => onRemove(r.id)}
            aria-label={`Remover ${r.name || r.email}`}
            className="ml-0.5 shrink-0 rounded-full hover:text-fmz-error"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {recipients.length > max && (
        <span className="inline-flex items-center rounded-full bg-fmz-page px-2.5 py-1 text-xs text-fmz-text-muted">
          +{recipients.length - max} mais
        </span>
      )}
    </div>
  );
}

// ─── Por usuário tab ──────────────────────────────────────────────────────────

function TabUsuario({ selected, onSelect }: Props) {
  const [query, setQuery]             = useState('');
  const [results, setResults]         = useState<FmzAdminEmailRecipient[]>([]);
  const [searching, setSearching]     = useState(false);
  const [externalInput, setExtInput]  = useState('');
  const debounceRef                   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generationRef                 = useRef(0);

  const fetchUsers = useCallback(async (search: string) => {
    const gen = ++generationRef.current;
    setSearching(true);
    try {
      const { items } = await getAdminUsers({ search, limit: SEARCH_LIMIT });
      if (gen !== generationRef.current) return;
      setResults(
        items
          .filter((u) => u.email)
          .map((u) => ({ id: u.id, name: u.name, email: u.email })),
      );
    } catch {
      if (gen === generationRef.current) setResults([]);
    } finally {
      if (gen === generationRef.current) setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { void fetchUsers(query); }, DEBOUNCE_MS);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, fetchUsers]);

  const selectedIds = new Set(selected.map((r) => r.id));

  const toggle = (r: FmzAdminEmailRecipient) => {
    onSelect(
      selectedIds.has(r.id)
        ? selected.filter((s) => s.id !== r.id)
        : [...selected, r],
    );
  };

  const addExternal = () => {
    const email = externalInput.trim();
    if (!isValidEmail(email)) return;
    if (selected.some((r) => r.email === email)) {
      setExtInput('');
      return;
    }
    onSelect([...selected, { id: `ext:${email}`, name: '', email }]);
    setExtInput('');
  };

  const remove = (id: string) => onSelect(selected.filter((r) => r.id !== id));

  return (
    <div className="flex flex-col gap-3">
      {/* External email input */}
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="Adicionar e-mail externo..."
          value={externalInput}
          onChange={(e) => setExtInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExternal(); } }}
          className="min-w-0 flex-1 rounded-lg border border-fmz-border-light bg-fmz-page px-3 py-2 text-sm text-fmz-text-primary placeholder-fmz-text-hint outline-none focus:border-fmz-border-mid focus:ring-1 focus:ring-[#0D1321]/10"
        />
        <button
          type="button"
          onClick={addExternal}
          disabled={!isValidEmail(externalInput)}
          className="flex items-center gap-1 rounded-lg border border-fmz-border-light bg-fmz-page px-3 py-2 text-xs font-medium text-fmz-text-muted transition-colors hover:bg-fmz-border-light disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {/* User search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fmz-text-hint" />
        <input
          type="text"
          placeholder="Buscar usuário por nome ou e-mail..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-fmz-border-light bg-fmz-page py-2 pl-9 pr-4 text-sm text-fmz-text-primary placeholder-fmz-text-hint outline-none focus:border-fmz-border-mid focus:ring-1 focus:ring-[#0D1321]/10"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-fmz-text-hint" />
        )}
      </div>

      {results.length > 0 && (
        <ul className="max-h-40 overflow-y-auto rounded-lg border border-fmz-border-light bg-fmz-card divide-y divide-fmz-border-light">
          {results.map((user) => {
            const isSel = selectedIds.has(user.id);
            return (
              <li key={user.id}>
                <button
                  type="button"
                  onClick={() => toggle(user)}
                  className={fmzCn(
                    'flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors',
                    isSel
                      ? 'bg-[#F5C842]/10 text-fmz-navy'
                      : 'text-fmz-text-primary hover:bg-fmz-page',
                  )}
                >
                  <UserRound className="h-3.5 w-3.5 shrink-0 text-fmz-text-hint" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{user.name || user.email}</span>
                    {user.name && (
                      <span className="block truncate text-xs text-fmz-text-hint">{user.email}</span>
                    )}
                  </span>
                  {isSel && (
                    <span className="shrink-0 text-xs font-bold text-fmz-success">✓</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <RecipientChips recipients={selected} onRemove={remove} />
    </div>
  );
}

// ─── Por imóvel tab ───────────────────────────────────────────────────────────

function TabImovel() {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <Building2 className="h-8 w-8 text-fmz-text-hint opacity-50" />
      <p className="text-sm font-medium text-fmz-text-muted">Em breve</p>
      <p className="max-w-[220px] text-xs text-fmz-text-hint">
        Selecione imóveis para enviar e-mails aos inquilinos e co-owners vinculados.
      </p>
    </div>
  );
}

// ─── Plataforma tab ───────────────────────────────────────────────────────────

type PlatOption = 'todos' | 'inquilinas' | 'coowners';

const PLAT_OPTIONS: { value: PlatOption; label: string; description: string; available: boolean }[] = [
  {
    value:       'todos',
    label:       'Todos os usuários',
    description: 'Inquilinas e co-owners ativos na plataforma.',
    available:   true,
  },
  {
    value:       'inquilinas',
    label:       'Apenas inquilinas',
    description: 'Em breve.',
    available:   false,
  },
  {
    value:       'coowners',
    label:       'Apenas co-owners',
    description: 'Em breve.',
    available:   false,
  },
];

function TabPlataforma({ selected, onSelect }: Props) {
  const [platOption, setPlatOption] = useState<PlatOption>('todos');
  const [loading, setLoading]       = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await getAdminUsers({ limit: 200 });
      const recipients: FmzAdminEmailRecipient[] = items
        .filter((u) => u.email)
        .map((u) => ({ id: u.id, name: u.name, email: u.email }));
      onSelect(recipients);
    } catch {
      // ignore — user can retry
    } finally {
      setLoading(false);
    }
  }, [onSelect]);

  const remove = (id: string) => onSelect(selected.filter((r) => r.id !== id));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        {PLAT_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={fmzCn(
              'flex items-start gap-3 rounded-lg border p-3 transition-colors',
              opt.available ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
              opt.available && platOption === opt.value
                ? 'border-[#0D1321]/30 bg-[#0D1321]/5'
                : opt.available
                  ? 'border-fmz-border-light hover:bg-fmz-page'
                  : 'border-fmz-border-light',
            )}
          >
            <input
              type="radio"
              name="plat-option"
              value={opt.value}
              checked={platOption === opt.value}
              disabled={!opt.available}
              onChange={() => setPlatOption(opt.value)}
              className="mt-0.5 accent-fmz-navy"
            />
            <div>
              <span className="text-sm font-medium text-fmz-text-primary">{opt.label}</span>
              <p className="text-xs text-fmz-text-hint">{opt.description}</p>
            </div>
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={loadAll}
        disabled={loading || platOption !== 'todos'}
        className="flex items-center justify-center gap-2 rounded-lg bg-fmz-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#162030] disabled:opacity-50"
      >
        {loading
          ? <><Loader2 className="h-4 w-4 animate-spin" />Carregando...</>
          : <><Users className="h-4 w-4" />Carregar destinatários</>
        }
      </button>

      <RecipientChips recipients={selected} onRemove={remove} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FmzRecipientSelector({ selected, onSelect }: Props) {
  const [activeTab, setActiveTab] = useState<RecipientTab>('usuario');

  return (
    <div className="flex flex-col gap-3">
      {/* Tab bar */}
      <div className="flex gap-0.5 rounded-lg border border-fmz-border-light bg-fmz-page p-0.5">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={fmzCn(
              'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
              activeTab === tab.value
                ? 'border border-fmz-border-light bg-fmz-card text-fmz-navy shadow-sm'
                : 'text-fmz-text-muted hover:text-fmz-text-primary',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'usuario'    && <TabUsuario    selected={selected} onSelect={onSelect} />}
      {activeTab === 'imovel'     && <TabImovel />}
      {activeTab === 'plataforma' && <TabPlataforma selected={selected} onSelect={onSelect} />}
    </div>
  );
}
