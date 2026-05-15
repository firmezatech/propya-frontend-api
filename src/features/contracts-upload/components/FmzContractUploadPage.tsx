'use client';

import { useCallback, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import {
  Check,
  FileText,
  Loader2,
  Sparkles,
  Trash2,
  UploadCloud,
  WandSparkles,
  X,
} from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';

type RentAdjustmentIndex = '' | 'IGPM' | 'IPCA' | 'INPC' | 'IPC' | 'FIXO';

type ContractFormState = {
  tenantName: string;
  tenantCpf: string;
  tenantPhone: string;
  owners: string;
  propertyAddress: string;
  rentAmount: string;
  dueDay: string;
  startDate: string;
  endDate: string;
  adjustmentIndex: RentAdjustmentIndex;
  fixedAdjustmentPercent: string;
  administrationFeePercent: string;
  terminationPenalty: string;
  guaranteeType: string;
  notes: string;
};

type ToastState = { message: string; tone: 'success' | 'error' } | null;

const EMPTY_FORM: ContractFormState = {
  tenantName: '',
  tenantCpf: '',
  tenantPhone: '',
  owners: '',
  propertyAddress: '',
  rentAmount: '',
  dueDay: '',
  startDate: '',
  endDate: '',
  adjustmentIndex: '',
  fixedAdjustmentPercent: '',
  administrationFeePercent: '',
  terminationPenalty: '',
  guaranteeType: '',
  notes: '',
};

const adjustmentIndexes: { label: string; value: RentAdjustmentIndex }[] = [
  { label: 'IGP-M', value: 'IGPM' },
  { label: 'IPCA', value: 'IPCA' },
  { label: 'INPC', value: 'INPC' },
  { label: 'IPC', value: 'IPC' },
  { label: 'Fixo (%)', value: 'FIXO' },
];

const guaranteeTypes = ['Caução', 'Fiador', 'Seguro fiança', 'Título de capitalização', 'Sem garantia'];
const dueDays = ['5', '10', '15', '20', '25'];

const acceptedPdfTypes = ['application/pdf'];

const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const applyMoneyMask = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const cents = (Number.parseInt(digits, 10) / 100).toFixed(2);
  return cents.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const buildMockAiExtraction = (file: File): Partial<ContractFormState> => ({
  tenantName: 'Dados extraídos pela IA',
  tenantCpf: '000.000.000-00',
  owners: 'Proprietário identificado no contrato',
  propertyAddress: 'Endereço identificado no contrato',
  rentAmount: '1.500,00',
  dueDay: '10',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
  adjustmentIndex: 'IGPM',
  administrationFeePercent: '7.5',
  terminationPenalty: 'Conforme cláusula de rescisão do contrato',
  guaranteeType: 'Caução',
  notes: `Arquivo analisado: ${file.name}. Revise os dados extraídos antes de salvar.`,
});

function AiTag() {
  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded-md border border-[#D4C8FF] bg-[#F3F0FF] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6C47FF]">
      <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
      IA
    </span>
  );
}

function FieldLabel({ children, ai = false }: { children: string; ai?: boolean }) {
  return (
    <label className="mb-2 flex items-center text-[11px] font-semibold uppercase tracking-[0.08em] text-fmz-text-muted">
      {children}
      {ai && <AiTag />}
    </label>
  );
}

function TextInput({
  label,
  value,
  placeholder,
  ai,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  placeholder?: string;
  ai?: boolean;
  onChange: (value: string) => void;
  type?: 'text' | 'date' | 'number';
}) {
  return (
    <div className="mb-5 min-w-0">
      <FieldLabel ai={ai}>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={fmzCn(
          'w-full rounded-[9px] border-[1.5px] border-fmz-border-light bg-fmz-page px-3.5 py-2.5 text-sm text-fmz-navy outline-none transition placeholder:text-fmz-text-hint focus:border-fmz-gold focus:bg-white focus:ring-4 focus:ring-[#F5C842]/15',
          ai && value && 'border-[#D4C8FF] bg-[#F3F0FF] focus:border-[#6C47FF] focus:ring-[#6C47FF]/10',
        )}
      />
    </div>
  );
}

function SelectInput({
  label,
  value,
  options,
  placeholder = 'Selecione...',
  ai,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  ai?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-5 min-w-0">
      <FieldLabel ai={ai}>{label}</FieldLabel>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fmzCn(
          'w-full rounded-[9px] border-[1.5px] border-fmz-border-light bg-fmz-page px-3.5 py-2.5 text-sm text-fmz-navy outline-none transition focus:border-fmz-gold focus:bg-white focus:ring-4 focus:ring-[#F5C842]/15',
          ai && value && 'border-[#D4C8FF] bg-[#F3F0FF] focus:border-[#6C47FF] focus:ring-[#6C47FF]/10',
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function TextAreaInput({
  label,
  value,
  placeholder,
  ai,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  placeholder?: string;
  ai?: boolean;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <div className="mb-5 min-w-0">
      <FieldLabel ai={ai}>{label}</FieldLabel>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={fmzCn(
          'min-h-[88px] w-full resize-y rounded-[9px] border-[1.5px] border-fmz-border-light bg-fmz-page px-3.5 py-2.5 text-sm text-fmz-navy outline-none transition placeholder:text-fmz-text-hint focus:border-fmz-gold focus:bg-white focus:ring-4 focus:ring-[#F5C842]/15',
          ai && value && 'border-[#D4C8FF] bg-[#F3F0FF] focus:border-[#6C47FF] focus:ring-[#6C47FF]/10',
        )}
      />
    </div>
  );
}

export function FmzContractUploadPage() {
  const [form, setForm] = useState<ContractFormState>(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [status, setStatus] = useState<{ message: string; tone?: 'success' | 'error' }>({ message: '' });
  const [toast, setToast] = useState<ToastState>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selectedFileSize = useMemo(() => (selectedFile ? formatFileSize(selectedFile.size) : ''), [selectedFile]);

  const notify = useCallback((message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const updateForm = useCallback(<K extends keyof ContractFormState>(key: K, value: ContractFormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  }, []);

  const handleFile = useCallback((file: File | undefined) => {
    if (!file) return;
    if (!acceptedPdfTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
      notify('Apenas arquivos PDF são aceitos.', 'error');
      return;
    }
    setSelectedFile(file);
    setStatus({ message: '' });
  }, [notify]);

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
  }, [handleFile]);

  const handleDrop = useCallback((event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  }, [handleFile]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setStatus({ message: '' });
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const extractWithAI = useCallback(async () => {
    if (!selectedFile) return;
    setIsExtracting(true);
    setStatus({ message: 'Lendo o contrato e preparando a extração...' });

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      setForm((previous) => ({ ...previous, ...buildMockAiExtraction(selectedFile) }));
      setStatus({ message: 'Dados sugeridos pela IA. Revise antes de salvar.', tone: 'success' });
      notify('IA extraiu os dados. Revise os campos destacados.', 'success');
    } catch {
      setStatus({ message: 'Erro ao processar o contrato. Tente novamente.', tone: 'error' });
      notify('Erro ao processar o contrato.', 'error');
    } finally {
      setIsExtracting(false);
    }
  }, [notify, selectedFile]);

  const clearAll = useCallback(() => {
    setForm(EMPTY_FORM);
    clearFile();
    notify('Formulário limpo.', 'success');
  }, [clearFile, notify]);

  const saveContract = useCallback(() => {
    if (!form.tenantName.trim()) {
      notify('Preencha o nome do(a) inquilino(a).', 'error');
      return;
    }
    if (!form.rentAmount.trim()) {
      notify('Informe o valor do aluguel.', 'error');
      return;
    }
    notify('Contrato salvo com sucesso.', 'success');
  }, [form.rentAmount, form.tenantName, notify]);

  return (
    <section className="flex min-h-full flex-col gap-7 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-fmz-text-hint">Gestão de Contratos</p>
          <h1 className="font-syne text-[26px] font-extrabold tracking-[-0.03em] text-fmz-navy sm:text-3xl">Novo contrato de aluguel</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-fmz-text-muted">
            Suba o PDF do contrato, extraia os dados principais e revise as informações antes de salvar no sistema.
          </p>
        </div>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.72fr)]">
        <div className="min-w-0 space-y-4">
          <div className="rounded-[14px] border-[1.5px] border-fmz-border-light bg-white p-5 shadow-sm sm:p-7">
            <h2 className="font-syne text-base font-bold text-fmz-navy">Contrato em PDF</h2>
            <p className="mt-1 text-sm leading-6 text-fmz-text-muted">Arraste o arquivo ou clique para selecionar. A IA poderá preencher os campos abaixo automaticamente.</p>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={fmzCn(
                'relative mt-6 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-fmz-border-light bg-fmz-page px-6 py-10 text-center transition hover:border-fmz-gold hover:bg-[#FFFDF0] sm:py-12',
                isDragging && 'border-fmz-gold bg-[#FFFDF0]',
              )}
            >
              <input ref={inputRef} type="file" accept=".pdf,application/pdf" onChange={handleInputChange} className="sr-only" />
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-[14px] border-[1.5px] border-fmz-border-light bg-white text-fmz-text-hint">
                <UploadCloud className="h-6 w-6" aria-hidden="true" />
              </span>
              <strong className="font-syne text-base text-fmz-navy">Arraste o contrato aqui</strong>
              <span className="mt-1 text-sm text-fmz-text-hint">ou clique para selecionar do seu computador</span>
              <span className="mt-4 rounded-md border border-fmz-border-light bg-[#F0F1F5] px-2 py-0.5 text-[11px] font-semibold text-fmz-text-muted">PDF</span>
            </button>

            {selectedFile && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border-[1.5px] border-fmz-success-border bg-fmz-success-bg px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-fmz-success-border bg-white text-fmz-success">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fmz-navy">{selectedFile.name}</p>
                  <p className="mt-0.5 text-xs text-fmz-text-muted">{selectedFileSize}</p>
                </div>
                <button type="button" onClick={clearFile} className="rounded-lg p-2 text-fmz-text-hint transition hover:bg-white hover:text-fmz-error" aria-label="Remover arquivo">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}

            <button
              type="button"
              disabled={!selectedFile || isExtracting}
              onClick={extractWithAI}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#6C47FF] to-[#9B72FF] px-4 py-3.5 font-syne text-sm font-bold uppercase tracking-[0.06em] text-white shadow-[0_6px_22px_rgba(108,71,255,0.28)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExtracting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <WandSparkles className="h-4 w-4" aria-hidden="true" />}
              {isExtracting ? 'Extraindo...' : 'Extrair com IA'}
            </button>
            {status.message && (
              <p className={fmzCn('mt-3 min-h-5 text-center text-sm', status.tone === 'success' && 'text-fmz-success', status.tone === 'error' && 'text-fmz-error', !status.tone && 'text-fmz-text-muted')}>
                {status.message}
              </p>
            )}
          </div>

          <div className="rounded-[14px] border-[1.5px] border-fmz-border-light bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <h2 className="font-syne text-base font-bold text-fmz-navy">Dados do contrato</h2>
              <span className="inline-flex items-center gap-1 rounded-md border border-[#D4C8FF] bg-[#F3F0FF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6C47FF]">
                <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
                Preenchido por IA
              </span>
            </div>

            <div className="grid min-w-0 gap-x-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <TextInput label="Inquilino(a) *" value={form.tenantName} placeholder="Nome completo do(a) inquilino(a)" ai onChange={(value) => updateForm('tenantName', value)} />
              </div>
              <TextInput label="CPF do(a) inquilino(a)" value={form.tenantCpf} placeholder="000.000.000-00" ai onChange={(value) => updateForm('tenantCpf', value)} />
              <TextInput label="Telefone / WhatsApp" value={form.tenantPhone} placeholder="+55 11 9 0000-0000" onChange={(value) => updateForm('tenantPhone', value)} />
              <div className="sm:col-span-2">
                <TextAreaInput label="Proprietário(s) *" value={form.owners} placeholder="Nome(s) do(s) proprietário(s), um por linha" ai rows={2} onChange={(value) => updateForm('owners', value)} />
              </div>
              <div className="sm:col-span-2">
                <TextInput label="Endereço do imóvel *" value={form.propertyAddress} placeholder="Rua, número, complemento, bairro, cidade — UF" ai onChange={(value) => updateForm('propertyAddress', value)} />
              </div>
              <TextInput label="Valor do aluguel (R$) *" value={form.rentAmount} placeholder="0,00" ai onChange={(value) => updateForm('rentAmount', applyMoneyMask(value))} />
              <SelectInput label="Dia de vencimento" value={form.dueDay} options={dueDays} placeholder="Selecione..." ai onChange={(value) => updateForm('dueDay', value)} />
              <TextInput label="Início da vigência *" type="date" value={form.startDate} ai onChange={(value) => updateForm('startDate', value)} />
              <TextInput label="Fim da vigência *" type="date" value={form.endDate} ai onChange={(value) => updateForm('endDate', value)} />

              <div className="mb-5 sm:col-span-2">
                <FieldLabel ai>Índice de reajuste anual</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {adjustmentIndexes.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateForm('adjustmentIndex', option.value)}
                      className={fmzCn(
                        'rounded-lg border-[1.5px] px-3.5 py-2 text-[13px] font-semibold transition',
                        form.adjustmentIndex === option.value
                          ? 'border-[#6C47FF] bg-[#F3F0FF] text-[#6C47FF]'
                          : 'border-fmz-border-light bg-white text-fmz-text-muted hover:border-fmz-navy hover:text-fmz-navy',
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {form.adjustmentIndex === 'FIXO' && (
                <TextInput label="Percentual fixo de reajuste (%)" type="number" value={form.fixedAdjustmentPercent} placeholder="0,00" onChange={(value) => updateForm('fixedAdjustmentPercent', value)} />
              )}
              <TextInput label="Taxa de administração (%)" type="number" value={form.administrationFeePercent} placeholder="Ex: 7.5" onChange={(value) => updateForm('administrationFeePercent', value)} />
              <TextInput label="Multa por rescisão" value={form.terminationPenalty} placeholder="Ex: 3 aluguéis ou 10%" ai onChange={(value) => updateForm('terminationPenalty', value)} />
              <SelectInput label="Tipo de garantia" value={form.guaranteeType} options={guaranteeTypes} ai onChange={(value) => updateForm('guaranteeType', value)} />
              <div className="sm:col-span-2">
                <TextAreaInput label="Observações do contrato" value={form.notes} placeholder="Cláusulas especiais, condições adicionais, notas importantes..." rows={3} onChange={(value) => updateForm('notes', value)} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[14px] border-[1.5px] border-fmz-border-light bg-white p-5 shadow-sm sm:p-6">
            <p className="max-w-xl text-sm leading-6 text-fmz-text-muted">
              Campos marcados com <strong className="font-semibold text-fmz-navy">IA</strong> são sugestões da extração automática. Revise tudo antes de salvar.
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={clearAll} className="inline-flex items-center gap-2 rounded-[9px] border-[1.5px] border-fmz-border-light bg-white px-5 py-2.5 text-sm font-medium text-fmz-text-muted transition hover:border-fmz-navy hover:text-fmz-navy">
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Limpar
              </button>
              <button type="button" onClick={saveContract} className="inline-flex items-center gap-2 rounded-[9px] bg-fmz-gold px-5 py-2.5 font-syne text-sm font-bold uppercase tracking-[0.06em] text-fmz-navy shadow-[0_4px_16px_rgba(245,200,66,0.3)] transition hover:bg-fmz-gold-dark">
                <Check className="h-4 w-4" aria-hidden="true" />
                Salvar contrato
              </button>
            </div>
          </div>
        </div>

        <aside className="min-w-0 space-y-4">
          <div className="rounded-[14px] border-[1.5px] border-fmz-border-light bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-5 font-syne text-base font-bold text-fmz-navy">Como funciona</h2>
            <div className="space-y-0">
              {[
                ['Suba o PDF do contrato', 'Arraste ou selecione o arquivo. O fluxo foi preparado para contratos digitalizados ou nativos em PDF.'],
                ['IA lê e extrai os dados', 'A extração identifica inquilina, proprietárias, endereço, aluguel, vigência, reajuste e garantia.'],
                ['Revise e corrija', 'Campos sugeridos aparecem destacados. Você pode editar qualquer informação antes de salvar.'],
                ['Salve no sistema', 'O contrato e seus dados ficam prontos para serem vinculados ao imóvel e à inquilina.'],
              ].map(([title, description], index, steps) => (
                <div key={title} className="relative flex gap-3 pb-5 last:pb-0">
                  {index < steps.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-fmz-border-light" aria-hidden="true" />}
                  <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fmz-navy font-syne text-xs font-bold text-white">{index + 1}</span>
                  <div className="min-w-0">
                    <h3 className="font-syne text-sm font-bold text-fmz-navy">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-fmz-text-muted">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-fmz-navy px-4 py-3 text-sm font-medium text-white shadow-lg">
          <span className={fmzCn('flex h-5 w-5 items-center justify-center rounded-full', toast.tone === 'success' ? 'bg-fmz-gold text-fmz-navy' : 'bg-fmz-error text-white')}>
            {toast.tone === 'success' ? <Check className="h-3 w-3" aria-hidden="true" /> : <X className="h-3 w-3" aria-hidden="true" />}
          </span>
          {toast.message}
        </div>
      )}
    </section>
  );
}
