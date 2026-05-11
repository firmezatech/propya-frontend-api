'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import type { FmzAdminPaginationMeta } from '../domain/fmz-admin-pagination.types';

type FmzAdminPaginationProps = FmzAdminPaginationMeta & {
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  disabled?: boolean;
  limitOptions?: number[];
};

export function FmzAdminPagination({
  page,
  limit,
  total,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  onLimitChange,
  disabled = false,
  limitOptions = [6, 10, 20, 50],
}: FmzAdminPaginationProps) {
  const firstItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastItem = Math.min(total, page * limit);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#E8EAF0] bg-white px-4 py-3 text-[12.5px] text-[#5A6478] shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <span className="font-semibold text-[#0D1321]">{firstItem}–{lastItem}</span> de{' '}
        <span className="font-semibold text-[#0D1321]">{total}</span> registros
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <label className="flex items-center gap-2">
          <span>Itens por página</span>
          <select
            value={limit}
            disabled={disabled}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            className="rounded-[9px] border border-[#E8EAF0] bg-[#F7F8FA] px-2.5 py-2 text-[12px] font-semibold text-[#0D1321] outline-none transition focus:border-[#F5C842]"
          >
            {limitOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled || !hasPreviousPage}
            onClick={() => onPageChange(page - 1)}
            className={fmzCn(
              'inline-flex h-9 w-9 items-center justify-center rounded-[9px] border border-[#E8EAF0] bg-[#F7F8FA] text-[#0D1321] transition hover:border-[#0D1321]',
              (disabled || !hasPreviousPage) && 'cursor-not-allowed opacity-40 hover:border-[#E8EAF0]',
            )}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="min-w-[92px] text-center font-semibold text-[#0D1321]">Página {page} de {totalPages}</span>

          <button
            type="button"
            disabled={disabled || !hasNextPage}
            onClick={() => onPageChange(page + 1)}
            className={fmzCn(
              'inline-flex h-9 w-9 items-center justify-center rounded-[9px] border border-[#E8EAF0] bg-[#F7F8FA] text-[#0D1321] transition hover:border-[#0D1321]',
              (disabled || !hasNextPage) && 'cursor-not-allowed opacity-40 hover:border-[#E8EAF0]',
            )}
            aria-label="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
