import Image from 'next/image';
import { fmzCn } from '../../lib/fmz-classnames';
import { fmzPublicLayoutConfig } from '../../config/fmz-public-layout-config';

type FmzBrandMarkProps = {
  size?: 'header' | 'form';
  showText?: boolean;
  className?: string;
};

const brandSizeClassNames = {
  header: {
    wrapper: 'gap-3',
    icon: 'h-9 w-9 rounded-[9px]',
    image: 36,
    text: 'text-[17px]',
  },
  form: {
    wrapper: 'gap-3',
    icon: 'h-11 w-11 rounded-xl',
    image: 44,
    text: 'text-xl',
  },
} as const;

export function FmzBrandMark({ size = 'header', showText = true, className = '' }: FmzBrandMarkProps) {
  const sizeClassNames = brandSizeClassNames[size];

  return (
    <span className={fmzCn('inline-flex items-center no-underline', sizeClassNames.wrapper, className)}>
      <span className={fmzCn('inline-flex items-center justify-center overflow-hidden bg-transparent', sizeClassNames.icon)}>
        <Image
          priority={size === 'header'}
          src={fmzPublicLayoutConfig.logoPath}
          alt="Firmeza Token"
          width={sizeClassNames.image}
          height={sizeClassNames.image}
          className="h-full w-full rounded-[inherit] object-contain"
        />
      </span>
      {showText && (
        <span className={fmzCn('font-sans font-bold tracking-[-0.02em] text-fmz-navy', sizeClassNames.text)}>
          {fmzPublicLayoutConfig.appName}
        </span>
      )}
    </span>
  );
}
