'use client';

import { Loader2, Monitor } from 'lucide-react';

type Props = {
  html: string;
  loading: boolean;
};

export function FmzEmailPreviewPanel({ html, loading }: Props) {
  if (loading) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <div className="flex flex-col items-center gap-3 text-fmz-neutral-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Gerando pré-visualização...</span>
        </div>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <div className="flex flex-col items-center gap-3 text-fmz-neutral-400">
          <Monitor className="h-8 w-8 opacity-40" />
          <span className="text-sm">Preencha os campos e clique em &ldquo;Gerar pré-visualização&rdquo;.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <div className="border-b border-white/10 bg-white/5 px-4 py-2">
        <span className="text-xs font-medium text-fmz-neutral-400">Pré-visualização do e-mail</span>
      </div>
      {/* HTML comes from our own template files rendered server-side — not from user input */}
      <iframe
        srcDoc={html}
        title="Pré-visualização do e-mail"
        className="h-[480px] w-full bg-white"
        sandbox="allow-same-origin"
      />
    </div>
  );
}
