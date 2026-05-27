'use client';

/**
 * RegisterPage — multi-step registration form orchestrator.
 *
 * Step ownership:
 *   Step 1 (Acesso)      — account type, email, password, phone, terms
 *   Step 2 (Identidade)  — full name, birthdate (masked), CPF (masked + validated)
 *   Step 3 (Confirmação) — read-only summary + submit
 *
 * State model:
 *   A single `formData` object accumulates values across steps so that going
 *   back never loses previously entered data. Error maps are per-step and reset
 *   on step advance.
 *
 * What this component owns:
 *   - Step navigation state
 *   - Accumulated form data
 *   - Submission lifecycle (loading, success, API error)
 *
 * What this component must NOT own:
 *   - Validation logic (register.validation.ts)
 *   - HTTP calls (register-api.ts)
 *   - Side panel / stepper presentation (inlined for simplicity — small components)
 */

import { useState } from 'react';
import { useRouter } from '../../../i18n/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  TrendingUp,
  User,
} from 'lucide-react';
import { FmzBrandMark } from '../../../components/layout';
import { registerUser } from './register-api';
import {
  birthdateBRToISO,
  computePasswordStrength,
  hasErrors,
  maskBirthdate,
  maskCpf,
  PASSWORD_STRENGTH_COLORS,
  PASSWORD_STRENGTH_LABELS,
  validateStep1,
  validateStep2,
} from './register.validation';
import type { AccountType, RegisterAllErrors, RegisterFormData } from './register.types';
import styles from './register.module.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 3;

const STEP_LABELS = ['Acesso', 'Identidade', 'Confirmação'] as const;

const INITIAL_FORM_DATA: RegisterFormData = {
  accountType: 'tenant',
  email: '',
  password: '',
  passwordConfirmation: '',
  phone: '',
  acceptedTerms: false,
  acceptedPrivacyPolicy: false,
  fullName: '',
  birthdate: '',
  cpf: '',
};

// ─── Side panel ───────────────────────────────────────────────────────────────

function RegisterSidePanel() {
  return (
    <aside className={styles.sidePanel} aria-hidden="true">
      <div className={styles.sidePanelLogo}>
        <FmzBrandMark size="form" />
      </div>

      <h2 className={styles.sidePanelHeadline}>
        Invista no futuro.<br />Comece agora.
      </h2>
      <p className={styles.sidePanelSub}>
        Crie sua conta em minutos e acesse oportunidades de investimento imobiliário tokenizado.
      </p>

      <div className={styles.sidePanelFeatures}>
        <div className={styles.sidePanelFeature}>
          <div className={styles.sidePanelFeatureIcon}>
            <TrendingUp size={18} aria-hidden="true" />
          </div>
          <div className={styles.sidePanelFeatureText}>
            <div className={styles.sidePanelFeatureTitle}>Rendimentos mensais</div>
            <div className={styles.sidePanelFeatureDesc}>
              Receba aluguéis proporcionais à sua participação diretamente na carteira.
            </div>
          </div>
        </div>

        <div className={styles.sidePanelFeature}>
          <div className={styles.sidePanelFeatureIcon}>
            <Building2 size={18} aria-hidden="true" />
          </div>
          <div className={styles.sidePanelFeatureText}>
            <div className={styles.sidePanelFeatureTitle}>Imóveis tokenizados</div>
            <div className={styles.sidePanelFeatureDesc}>
              Fracione sua participação em imóveis reais com total transparência e liquidez.
            </div>
          </div>
        </div>

        <div className={styles.sidePanelFeature}>
          <div className={styles.sidePanelFeatureIcon}>
            <ShieldCheck size={18} aria-hidden="true" />
          </div>
          <div className={styles.sidePanelFeatureText}>
            <div className={styles.sidePanelFeatureTitle}>Segurança e compliance</div>
            <div className={styles.sidePanelFeatureDesc}>
              Plataforma regulamentada com KYC completo e criptografia de ponta a ponta.
            </div>
          </div>
        </div>
      </div>

      <div className={styles.sidePanelTrust}>
        <Lock size={14} aria-hidden="true" />
        Seus dados são protegidos com criptografia SSL/TLS
      </div>
    </aside>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

type StepperProps = {
  currentStep: number; // 1-based
};

function RegisterStepper({ currentStep }: StepperProps) {
  return (
    <div className={styles.stepper} role="list" aria-label="Etapas do cadastro">
      {STEP_LABELS.map((label, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;

        return (
          <div key={label} style={{ display: 'contents' }}>
            <div className={styles.stepItem} role="listitem">
              <div
                className={`${styles.stepCircle} ${isActive ? styles.stepCircleActive : ''} ${isDone ? styles.stepCircleDone : ''}`}
                aria-current={isActive ? 'step' : undefined}
              >
                {isDone ? <Check size={14} aria-hidden="true" /> : stepNumber}
              </div>
              <span className={`${styles.stepLabel} ${isActive ? styles.stepLabelActive : ''} ${isDone ? styles.stepLabelDone : ''}`}>
                {label}
              </span>
            </div>

            {index < STEP_LABELS.length - 1 && (
              <div className={`${styles.stepConnector} ${isDone ? styles.stepConnectorDone : ''}`} aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Account type selector ────────────────────────────────────────────────────

type AccountTypeSelectorProps = {
  value: AccountType;
  onChange: (type: AccountType) => void;
};

function AccountTypeSelector({ value, onChange }: AccountTypeSelectorProps) {
  return (
    <div className={styles.accountTypeRow} role="radiogroup" aria-label="Tipo de conta">
      <button
        type="button"
        role="radio"
        aria-checked={value === 'tenant'}
        className={`${styles.accountTypeCard} ${value === 'tenant' ? styles.accountTypeCardSelected : ''}`}
        onClick={() => onChange('tenant')}
      >
        <div className={styles.accountTypeCardIcon}>
          <User size={16} aria-hidden="true" />
        </div>
        <div className={styles.accountTypeCardTitle}>Locatário</div>
        <div className={styles.accountTypeCardDesc}>Quero alugar um imóvel tokenizado</div>
        {value === 'tenant' && (
          <span className={styles.accountTypeCardCheck} aria-hidden="true">
            <Check size={11} />
          </span>
        )}
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={value === 'investor'}
        className={`${styles.accountTypeCard} ${value === 'investor' ? styles.accountTypeCardSelected : ''}`}
        onClick={() => onChange('investor')}
      >
        <div className={styles.accountTypeCardIcon}>
          <TrendingUp size={16} aria-hidden="true" />
        </div>
        <div className={styles.accountTypeCardTitle}>Investidor</div>
        <div className={styles.accountTypeCardDesc}>Quero investir em imóveis tokenizados</div>
        {value === 'investor' && (
          <span className={styles.accountTypeCardCheck} aria-hidden="true">
            <Check size={11} />
          </span>
        )}
      </button>
    </div>
  );
}

// ─── Password strength indicator ──────────────────────────────────────────────

type PasswordStrengthProps = {
  password: string;
};

function PasswordStrengthIndicator({ password }: PasswordStrengthProps) {
  const score = computePasswordStrength(password);
  if (!password) return null;

  const color = PASSWORD_STRENGTH_COLORS[score];
  const label = PASSWORD_STRENGTH_LABELS[score];

  return (
    <div className={styles.strengthRow}>
      <div className={styles.strengthBars} aria-hidden="true">
        {[1, 2, 3, 4].map((threshold) => (
          <div
            key={threshold}
            className={styles.strengthBar}
            style={{ background: score >= threshold ? color : undefined }}
          />
        ))}
      </div>
      <span className={styles.strengthLabel} style={{ color }} aria-live="polite" aria-label={`Força da senha: ${label}`}>
        {label}
      </span>
    </div>
  );
}

// ─── Error alert ──────────────────────────────────────────────────────────────

type ErrorAlertProps = {
  message: string;
};

function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div className={styles.alert} role="alert">
      <AlertTriangle size={16} className={styles.alertIcon} aria-hidden="true" />
      <div className={styles.alertText}>
        <div className={styles.alertTitle}>Revise os dados informados</div>
        {message}
      </div>
    </div>
  );
}

// ─── Success state ────────────────────────────────────────────────────────────

type SuccessStateProps = {
  formData: RegisterFormData;
  hasAutoLogin: boolean;
  onGoToLogin: () => void;
  onGoToDashboard: () => void;
};

function RegisterSuccessState({ formData, hasAutoLogin, onGoToLogin, onGoToDashboard }: SuccessStateProps) {
  return (
    <div className={styles.successWrapper}>
      <div className={styles.successIcon} aria-hidden="true">
        <CheckCircle size={36} />
      </div>

      <h2 className={styles.successTitle}>Conta criada!</h2>
      <p className={styles.successMessage}>
        Bem-vindo(a), {formData.fullName.split(' ')[0]}! Seu cadastro foi realizado com sucesso.
        {hasAutoLogin
          ? ' Você já está logado e será redirecionado para sua conta.'
          : ' Faça o login para acessar a plataforma.'}
      </p>

      {!hasAutoLogin && (
        <div className={styles.successSteps}>
          <div className={styles.successStep}>
            <div className={styles.successStepNum}>1</div>
            <div className={styles.successStepText}>Acesse com seu e-mail e senha cadastrados</div>
          </div>
          <div className={styles.successStep}>
            <div className={styles.successStepNum}>2</div>
            <div className={styles.successStepText}>Complete sua verificação KYC para liberar todas as funcionalidades</div>
          </div>
          <div className={styles.successStep}>
            <div className={styles.successStepNum}>3</div>
            <div className={styles.successStepText}>Explore as oportunidades disponíveis na plataforma</div>
          </div>
        </div>
      )}

      <button
        type="button"
        className={styles.btnPrimary}
        style={{ maxWidth: 320, height: 52 }}
        onClick={hasAutoLogin ? onGoToDashboard : onGoToLogin}
      >
        {hasAutoLogin ? 'Ir para o painel' : 'Fazer login'}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RegisterPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RegisterFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<RegisterAllErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasAutoLogin, setHasAutoLogin] = useState(false);

  // ── Field updaters ───────────────────────────────────────────────────────────

  const updateField = <K extends keyof RegisterFormData>(key: K, value: RegisterFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear the matching error eagerly so users get instant positive feedback.
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // ── Navigation ───────────────────────────────────────────────────────────────

  const goToPreviousStep = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const advanceToStep2 = () => {
    const step1Errors = validateStep1(formData);
    if (hasErrors(step1Errors)) {
      setErrors(step1Errors);
      return;
    }
    setErrors({});
    setCurrentStep(2);
  };

  const advanceToStep3 = () => {
    const step2Errors = validateStep2(formData);
    if (hasErrors(step2Errors)) {
      setErrors(step2Errors);
      return;
    }
    setErrors({});
    setCurrentStep(3);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await registerUser(formData);

      if (!result.success) {
        setErrors({ general: result.error.description ?? result.error.title });
        return;
      }

      const autoLogin = Boolean(result.access?.accessToken);
      setHasAutoLogin(autoLogin);
      setIsSuccess(true);

      if (autoLogin) {
        setTimeout(() => router.replace(result.access?.defaultRoute ?? '/connected/dashboard'), 2500);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render: success ──────────────────────────────────────────────────────────

  if (isSuccess) {
    return (
      <div className={styles.page}>
        <RegisterSidePanel />
        <main className={styles.main}>
          <div className={styles.formWrapper}>
            <div className={styles.formCard}>
              <RegisterSuccessState
                formData={formData}
                hasAutoLogin={hasAutoLogin}
                onGoToLogin={() => router.push('/')}
                onGoToDashboard={() => router.replace('/connected/dashboard')}
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Render: step form ────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <RegisterSidePanel />

      <main className={styles.main}>
        <div className={styles.formWrapper}>
          <RegisterStepper currentStep={currentStep} />

          <div className={styles.formCard}>
            {/* ── Step 1: Acesso ─────────────────────────────────────────── */}
            {currentStep === 1 && (
              <>
                <h1 className={styles.formTitle}>Crie sua conta</h1>
                <p className={styles.formSubtitle}>Escolha o tipo de conta e preencha os dados de acesso.</p>

                {errors.general && <ErrorAlert message={errors.general} />}

                <AccountTypeSelector
                  value={formData.accountType}
                  onChange={(type) => updateField('accountType', type)}
                />

                <div className={styles.fieldGroup}>
                  {errors.accountType && <p className={styles.fieldError}><AlertTriangle size={12} aria-hidden="true" />{errors.accountType}</p>}

                  <div className={styles.field}>
                    <label htmlFor="reg-email" className={styles.label}>E-mail</label>
                    <input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      placeholder="seu@email.com"
                      className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      aria-describedby={errors.email ? 'reg-email-error' : undefined}
                      aria-invalid={Boolean(errors.email)}
                    />
                    {errors.email && <p id="reg-email-error" className={styles.fieldError}><AlertTriangle size={12} aria-hidden="true" />{errors.email}</p>}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="reg-phone" className={styles.label}>Telefone (WhatsApp)</label>
                    <input
                      id="reg-phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+55 (11) 91234-5678"
                      className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      aria-describedby={errors.phone ? 'reg-phone-error' : undefined}
                      aria-invalid={Boolean(errors.phone)}
                    />
                    {errors.phone && <p id="reg-phone-error" className={styles.fieldError}><AlertTriangle size={12} aria-hidden="true" />{errors.phone}</p>}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="reg-password" className={styles.label}>Senha</label>
                    <div className={styles.passwordWrapper}>
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Crie uma senha forte"
                        className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                        value={formData.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        aria-describedby={errors.password ? 'reg-password-error' : 'reg-password-strength'}
                        aria-invalid={Boolean(errors.password)}
                      />
                      <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                      </button>
                    </div>
                    <div id="reg-password-strength">
                      <PasswordStrengthIndicator password={formData.password} />
                    </div>
                    {errors.password && <p id="reg-password-error" className={styles.fieldError}><AlertTriangle size={12} aria-hidden="true" />{errors.password}</p>}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="reg-password-confirm" className={styles.label}>Confirmar senha</label>
                    <div className={styles.passwordWrapper}>
                      <input
                        id="reg-password-confirm"
                        type={showPasswordConfirmation ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Repita a senha"
                        className={`${styles.input} ${errors.passwordConfirmation ? styles.inputError : ''}`}
                        value={formData.passwordConfirmation}
                        onChange={(e) => updateField('passwordConfirmation', e.target.value)}
                        aria-describedby={errors.passwordConfirmation ? 'reg-password-confirm-error' : undefined}
                        aria-invalid={Boolean(errors.passwordConfirmation)}
                      />
                      <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() => setShowPasswordConfirmation((v) => !v)}
                        aria-label={showPasswordConfirmation ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                      >
                        {showPasswordConfirmation ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                      </button>
                    </div>
                    {errors.passwordConfirmation && <p id="reg-password-confirm-error" className={styles.fieldError}><AlertTriangle size={12} aria-hidden="true" />{errors.passwordConfirmation}</p>}
                  </div>

                  <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={formData.acceptedTerms}
                        onChange={(e) => updateField('acceptedTerms', e.target.checked)}
                        aria-label="Aceito os Termos de Uso"
                      />
                      <span className={styles.checkboxLabel}>
                        Li e aceito os{' '}
                        <a href="/terms" target="_blank" rel="noopener noreferrer" className={styles.checkboxLink}>
                          Termos de Uso
                        </a>
                      </span>
                    </label>

                    <label className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={formData.acceptedPrivacyPolicy}
                        onChange={(e) => updateField('acceptedPrivacyPolicy', e.target.checked)}
                        aria-label="Aceito a Política de Privacidade"
                      />
                      <span className={styles.checkboxLabel}>
                        Li e aceito a{' '}
                        <a href="/privacy" target="_blank" rel="noopener noreferrer" className={styles.checkboxLink}>
                          Política de Privacidade
                        </a>
                      </span>
                    </label>

                    {errors.terms && <p className={styles.fieldError}><AlertTriangle size={12} aria-hidden="true" />{errors.terms}</p>}
                  </div>
                </div>

                <div className={styles.actions}>
                  <button type="button" className={styles.btnPrimary} onClick={advanceToStep2}>
                    Continuar
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </>
            )}

            {/* ── Step 2: Identidade ─────────────────────────────────────── */}
            {currentStep === 2 && (
              <>
                <h1 className={styles.formTitle}>Seus dados</h1>
                <p className={styles.formSubtitle}>Precisamos confirmar sua identidade para cumprir as exigências regulatórias.</p>

                {errors.general && <ErrorAlert message={errors.general} />}

                <div className={styles.fieldGroup}>
                  <div className={styles.field}>
                    <label htmlFor="reg-fullname" className={styles.label}>Nome completo</label>
                    <input
                      id="reg-fullname"
                      type="text"
                      autoComplete="name"
                      placeholder="Seu nome e sobrenome"
                      className={`${styles.input} ${errors.fullName ? styles.inputError : ''}`}
                      value={formData.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      aria-describedby={errors.fullName ? 'reg-fullname-error' : undefined}
                      aria-invalid={Boolean(errors.fullName)}
                    />
                    {errors.fullName && <p id="reg-fullname-error" className={styles.fieldError}><AlertTriangle size={12} aria-hidden="true" />{errors.fullName}</p>}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="reg-birthdate" className={styles.label}>Data de nascimento</label>
                    <input
                      id="reg-birthdate"
                      type="text"
                      inputMode="numeric"
                      autoComplete="bday"
                      placeholder="DD/MM/AAAA"
                      className={`${styles.input} ${errors.birthdate ? styles.inputError : ''}`}
                      value={formData.birthdate}
                      onChange={(e) => updateField('birthdate', maskBirthdate(e.target.value))}
                      aria-describedby={errors.birthdate ? 'reg-birthdate-error' : undefined}
                      aria-invalid={Boolean(errors.birthdate)}
                      maxLength={10}
                    />
                    {errors.birthdate && <p id="reg-birthdate-error" className={styles.fieldError}><AlertTriangle size={12} aria-hidden="true" />{errors.birthdate}</p>}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="reg-cpf" className={styles.label}>CPF</label>
                    <input
                      id="reg-cpf"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="000.000.000-00"
                      className={`${styles.input} ${errors.cpf ? styles.inputError : ''}`}
                      value={formData.cpf}
                      onChange={(e) => updateField('cpf', maskCpf(e.target.value))}
                      aria-describedby="reg-cpf-note reg-cpf-error"
                      aria-invalid={Boolean(errors.cpf)}
                      maxLength={14}
                    />
                    <p id="reg-cpf-note" className={styles.cpfNote}>
                      <Lock size={11} aria-hidden="true" />
                      Seu CPF é utilizado apenas para verificação de identidade e não é compartilhado.
                    </p>
                    {errors.cpf && <p id="reg-cpf-error" className={styles.fieldError}><AlertTriangle size={12} aria-hidden="true" />{errors.cpf}</p>}
                  </div>
                </div>

                <div className={styles.actions}>
                  <button type="button" className={styles.btnSecondary} onClick={goToPreviousStep}>
                    <ArrowLeft size={15} aria-hidden="true" />
                    Voltar
                  </button>
                  <button type="button" className={styles.btnPrimary} onClick={advanceToStep3}>
                    Continuar
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </>
            )}

            {/* ── Step 3: Confirmação ────────────────────────────────────── */}
            {currentStep === 3 && (
              <>
                <h1 className={styles.formTitle}>Confirme seus dados</h1>
                <p className={styles.formSubtitle}>Revise as informações antes de criar sua conta.</p>

                {errors.general && <ErrorAlert message={errors.general} />}

                <div className={styles.summaryCard} aria-label="Resumo dos dados informados">
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryKey}>Tipo de conta</span>
                    <span className={styles.summaryValue}>
                      {formData.accountType === 'tenant' ? 'Locatário' : 'Investidor'}
                    </span>
                  </div>
                  <div className={styles.summaryDivider} />
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryKey}>Nome</span>
                    <span className={styles.summaryValue}>{formData.fullName}</span>
                  </div>
                  <div className={styles.summaryDivider} />
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryKey}>E-mail</span>
                    <span className={styles.summaryValue}>{formData.email}</span>
                  </div>
                  <div className={styles.summaryDivider} />
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryKey}>Telefone</span>
                    <span className={styles.summaryValue}>{formData.phone}</span>
                  </div>
                  <div className={styles.summaryDivider} />
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryKey}>Nascimento</span>
                    <span className={styles.summaryValue}>{formData.birthdate}</span>
                  </div>
                  <div className={styles.summaryDivider} />
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryKey}>CPF</span>
                    <span className={styles.summaryValue}>{formData.cpf}</span>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button type="button" className={styles.btnSecondary} onClick={goToPreviousStep} disabled={isSubmitting}>
                    <ArrowLeft size={15} aria-hidden="true" />
                    Voltar
                  </button>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className={styles.spinner} aria-hidden="true" />
                        Criando conta...
                      </>
                    ) : (
                      <>
                        <Check size={16} aria-hidden="true" />
                        Criar conta
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className={styles.loginLink}>
            Já tem uma conta?{' '}
            <button
              type="button"
              className={styles.loginLinkBtn}
              onClick={() => router.push('/')}
            >
              Fazer login
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
