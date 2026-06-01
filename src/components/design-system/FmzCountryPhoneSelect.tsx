'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Phone, Search } from 'lucide-react';
import { fmzCn } from '../../lib/fmz-classnames';
import {
  FMZ_COUNTRY_PHONES,
  resolveFmzCountryPhone,
  type FmzCountryPhone,
} from '../../lib/fmz-country-phone-data';

type FmzCountryPhoneSelectProps = {
  /** Selected country as an ISO2 code (e.g. "BR"). Dial codes are also accepted. */
  value: string;
  onChange: (country: FmzCountryPhone) => void;
  disabled?: boolean;
  error?: boolean;
  ariaLabel?: string;
};

type MenuCoords = { top: number; left: number; width: number };

const MENU_MIN_WIDTH = 240;
const MENU_MAX_WIDTH = 320;
const VIEWPORT_MARGIN = 8;

const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const matchesQuery = (country: FmzCountryPhone, query: string): boolean => {
  const q = normalize(query.trim());
  if (!q) return true;
  const digits = q.replace(/\D/g, '');
  return (
    normalize(country.name).includes(q) ||
    country.iso2.toLowerCase().includes(q) ||
    (digits.length > 0 && country.dialCode.replace(/\D/g, '').includes(digits))
  );
};

export function FmzCountryPhoneSelect({ value, onChange, disabled = false, error = false, ariaLabel }: FmzCountryPhoneSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [coords, setCoords] = useState<MenuCoords | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const listboxId = useId();
  const selected = useMemo(() => resolveFmzCountryPhone(value), [value]);
  const filtered = useMemo(() => FMZ_COUNTRY_PHONES.filter((country) => matchesQuery(country, query)), [query]);

  // Position the portalled menu under the trigger, clamped to the viewport so it
  // never overflows the screen edge on mobile.
  const updatePosition = useCallback(() => {
    const trigger = buttonRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, MENU_MIN_WIDTH), Math.min(MENU_MAX_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2));
    const left = Math.max(VIEWPORT_MARGIN, Math.min(rect.left, window.innerWidth - width - VIEWPORT_MARGIN));
    setCoords({ top: rect.bottom + 6, left, width });
  }, []);

  const close = () => {
    setIsOpen(false);
    setQuery('');
  };

  const open = () => {
    if (disabled) return;
    updatePosition();
    setIsOpen(true);
    const selectedIndex = FMZ_COUNTRY_PHONES.findIndex((country) => country.iso2 === selected.iso2);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  };

  const choose = (country: FmzCountryPhone) => {
    onChange(country);
    close();
  };

  // Keep the menu attached to the trigger while scrolling/resizing, and close on
  // outside clicks. Listeners only live while the menu is open.
  useEffect(() => {
    if (!isOpen) return;

    searchRef.current?.focus();

    const handleReposition = () => updatePosition();
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!buttonRef.current?.contains(target) && !menuRef.current?.contains(target)) close();
    };

    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen, updatePosition]);

  // Keep the highlighted row visible and the active index within bounds.
  useEffect(() => {
    if (isOpen) listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, activeIndex, filtered.length]);

  useEffect(() => {
    if (activeIndex >= filtered.length) setActiveIndex(filtered.length > 0 ? filtered.length - 1 : 0);
  }, [filtered.length, activeIndex]);

  const handleButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (filtered[activeIndex]) choose(filtered[activeIndex]);
        break;
      case 'Escape':
        event.preventDefault();
        close();
        buttonRef.current?.focus();
        break;
      case 'Tab':
        close();
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative">
      <Phone className="pointer-events-none absolute left-3 top-1/2 z-10 h-[15px] w-[15px] -translate-y-1/2 text-fmz-text-hint" aria-hidden="true" />
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={handleButtonKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-label={ariaLabel ?? 'Código do país'}
        className={fmzCn(
          'flex h-full w-full items-center gap-1.5 rounded-[10px] border bg-white py-[11px] pl-[38px] pr-8 text-left text-[13.5px] text-fmz-navy outline-none transition',
          'focus-visible:border-fmz-gold focus-visible:ring-[3px] focus-visible:ring-fmz-gold/20',
          isOpen ? 'border-fmz-gold ring-[3px] ring-fmz-gold/20' : !error && 'border-fmz-border-light',
          error && 'border-[#F5C4BF] ring-[3px] ring-[#D94F3D]/10',
          disabled && 'cursor-not-allowed bg-fmz-page text-fmz-text-hint',
        )}
      >
        <span className="text-base leading-none">{selected.flag}</span>
        <span className="font-medium tabular-nums">{selected.dialCode}</span>
        <span className="text-fmz-text-muted">{selected.iso2}</span>
      </button>
      <ChevronDown
        className={fmzCn(
          'pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fmz-text-hint transition-transform',
          isOpen && 'rotate-180',
        )}
        aria-hidden="true"
      />

      {isOpen && coords
        ? createPortal(
            <div
              ref={menuRef}
              style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width }}
              className="z-[1000] overflow-hidden rounded-xl border border-fmz-border-light bg-white shadow-[0_12px_32px_-8px_rgba(13,19,33,0.22)]"
            >
              <div className="relative border-b border-fmz-border-light p-2">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fmz-text-hint" aria-hidden="true" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Buscar país…"
                  aria-label="Buscar país"
                  aria-controls={listboxId}
                  className="w-full rounded-lg border border-fmz-border-light bg-fmz-input py-2 pl-8 pr-3 text-[13px] text-fmz-navy outline-none placeholder:text-fmz-text-hint focus:border-fmz-gold focus:bg-white focus:ring-[3px] focus:ring-fmz-gold/15"
                />
              </div>
              <ul ref={listRef} id={listboxId} role="listbox" aria-label="Países" className="max-h-60 overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <li className="px-3 py-3 text-center text-[12.5px] text-fmz-text-muted">Nenhum país encontrado</li>
                ) : (
                  filtered.map((country, index) => {
                    const isSelected = country.iso2 === selected.iso2;
                    const isActive = index === activeIndex;
                    return (
                      <li key={country.iso2} role="option" aria-selected={isSelected} data-active={isActive}>
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => choose(country)}
                          onMouseEnter={() => setActiveIndex(index)}
                          className={fmzCn(
                            'flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-fmz-navy transition',
                            isActive && 'bg-fmz-input',
                            isSelected && 'font-semibold',
                          )}
                        >
                          <span className="text-base leading-none">{country.flag}</span>
                          <span className="min-w-0 flex-1 truncate">{country.name}</span>
                          <span className="tabular-nums text-fmz-text-muted">{country.dialCode}</span>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
