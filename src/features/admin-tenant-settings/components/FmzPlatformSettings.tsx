'use client';

import { useCallback, useState } from 'react';
import { Building2, Check, Home, X } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { FmzPlatformSettingsGeneralTab } from './FmzPlatformSettingsGeneralTab';
import { FmzPlatformSettingsPropertyTab } from './FmzPlatformSettingsPropertyTab';

type TabKey = 'imovel' | 'plataforma';
type Toast = { message: string; ok: boolean } | null;

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'imovel', label: 'Por imóvel', icon: <Home className="h-3.5 w-3.5" /> },
  { key: 'plataforma', label: 'Plataforma geral', icon: <Building2 className="h-3.5 w-3.5" /> },
];

export function FmzPlatformSettings() {
  const [activeTab, setActiveTab] = useState<TabKey>('imovel');
  const [toast, setToast] = useState<Toast>(null);

  const showToast = useCallback((message: string, ok = true) => {
    setToast({ message, ok });
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <>
      <div className="mb-6">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-fmz-text-hint">Sistema · Configurações</div>
        <h1 className="font-sans text-[26px] font-extrabold tracking-[-0.03em] text-fmz-navy">Configurações</h1>
        <p className="mt-1.5 max-w-[560px] text-[13px] leading-[1.6] text-fmz-text-muted">
          Defina metas e ajustes financeiros por imóvel, ou configure os parâmetros gerais da plataforma de tokenização Propya.
        </p>
      </div>

      <div className="mb-[22px] flex w-fit gap-1 rounded-[11px] border-[1.5px] border-fmz-border-light bg-white p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={fmzCn(
              'inline-flex items-center gap-2 rounded-[8px] px-4 py-2 text-[13px] font-semibold transition',
              activeTab === tab.key ? 'bg-fmz-navy text-white' : 'text-fmz-text-muted hover:text-fmz-navy',
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'imovel' ? (
        <FmzPlatformSettingsPropertyTab onToast={showToast} />
      ) : (
        <FmzPlatformSettingsGeneralTab onToast={showToast} />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-[11px] bg-fmz-navy px-4 py-3 text-[13px] font-semibold text-white shadow-lg">
          <span className={fmzCn('grid h-5 w-5 place-items-center rounded-full', toast.ok ? 'bg-fmz-gold text-fmz-navy' : 'bg-fmz-error text-white')}>
            {toast.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          </span>
          {toast.message}
        </div>
      )}
    </>
  );
}
