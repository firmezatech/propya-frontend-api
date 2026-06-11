import type { FmzKycSummary } from '../domain';

type Props = { summary: FmzKycSummary };

type Card = {
  label: string;
  value: number;
  iconBg: string;
  icon: React.ReactNode;
};

export function FmzAdminKycSummaryStrip({ summary }: Props) {
  const cards: Card[] = [
    {
      label: 'Aguardando revisão',
      value: summary.pendingCount,
      iconBg: 'bg-[#FFFBEB]',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#D97706" strokeWidth="1.6" />
          <path d="M12 8v4" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="16" r=".8" fill="#D97706" />
        </svg>
      ),
    },
    {
      label: 'Em análise',
      value: summary.inReviewCount,
      iconBg: 'bg-[#EFF6FF]',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M9 12l2 2 4-4" stroke="#2563EB" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="9" stroke="#2563EB" strokeWidth="1.6" />
        </svg>
      ),
    },
    {
      label: 'Aprovados',
      value: summary.approvedCount,
      iconBg: 'bg-[#F0FAF5]',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="#1A8C5B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: 'Negados',
      value: summary.declinedCount,
      iconBg: 'bg-[#FEF5F4]',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M6 6l12 12M18 6L6 18" stroke="#D94F3D" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex items-center gap-3 rounded-xl border-[1.5px] border-[#E8EAF0] bg-white px-[18px] py-4"
        >
          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[9px] ${card.iconBg}`}>
            {card.icon}
          </div>
          <div>
            <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[#9AA3B0]">
              {card.label}
            </div>
            <div className="font-sans text-[20px] font-extrabold text-[#0D1321]">
              {card.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
