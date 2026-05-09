import { FmzBrandMark } from './FmzBrandMark';
import { fmzCn } from '../../lib/fmz-classnames';

type FmzFullPageLoadingProps = {
  label?: string;
  description?: string;
  className?: string;
  withBrand?: boolean;
};

export function FmzFullPageLoading({
  label = 'Carregando...',
  description,
  className,
  withBrand = true,
}: FmzFullPageLoadingProps) {
  return (
    <div className={fmzCn('flex min-h-[100dvh] w-full items-center justify-center bg-[#F7F8FA] px-6 text-[#0D1321]', className)}>
      <div className="w-full max-w-sm rounded-2xl border border-[#E8EAF0] bg-white px-8 py-9 text-center shadow-sm">
        {withBrand ? <FmzBrandMark size="form" className="mb-6" /> : null}
        <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-[4px] border-[#E8EAF0] border-t-[#0D1321]" aria-hidden="true" />
        <p className="font-syne text-base font-extrabold tracking-[-0.02em] text-[#0D1321]">{label}</p>
        {description ? <p className="mt-2 text-[13px] leading-6 text-[#5A6478]">{description}</p> : null}
      </div>
    </div>
  );
}
