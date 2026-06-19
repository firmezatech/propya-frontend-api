'use client';

import { useRef, useState, type FormEvent } from 'react';
import {
  Eye,
  EyeOff,
  Info,
  Lock,
  Mail,
  UserPlus,
} from 'lucide-react';
import { z } from 'zod';
import { Link, useRouter } from '../../../i18n/navigation';
import { login, type LoginType } from '../services/fmz-login-api';
import { FmzAuthHeader, FmzFullPageLoading, FmzPublicFooter } from '../../../components/layout';
import { FMZ_API_ERROR_CODES, type FmzFieldErrorMap, type FmzNormalizedApiError } from '../../api-errors/domain';
import { buildFmzLoginSchema } from '../domain/fmz-auth-access-validation';

type FmzAuthAccessCardProps = {
  className?: string;
};

const ZOD_PATH_TO_FIELD: Record<string, keyof FmzFieldErrorMap> = Object.freeze({
  email: 'email',
  password: 'password',
});

const getFormStringValue = (formData: Record<string, FormDataEntryValue>, fieldName: string): string =>
  String(formData[fieldName] ?? '');

const buildValidationErrorState = (validationError: z.ZodError): {
  alertError: FmzNormalizedApiError;
  fieldErrors: FmzFieldErrorMap;
} => {
  const fieldErrors: FmzFieldErrorMap = {};

  validationError.errors.forEach((issue) => {
    const fieldName = ZOD_PATH_TO_FIELD[String(issue.path[0] ?? '')];
    if (!fieldName || fieldErrors[fieldName]) return;
    fieldErrors[fieldName] = issue.message;
  });

  return {
    fieldErrors,
    alertError: {
      code: FMZ_API_ERROR_CODES.VALIDATION_ERROR,
      title: 'Revise os dados informados',
      description: 'Alguns dados parecem incorretos. Corrija os campos destacados e tente novamente.',
      severity: 'error',
      fieldErrors,
    },
  };
};

function useLoginFormState() {
  const [apiError, setApiError] = useState<FmzNormalizedApiError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FmzFieldErrorMap>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirectingAfterLogin, setIsRedirectingAfterLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const setAuthErrorWithFields = (error: FmzNormalizedApiError) => {
    setApiError(error);
    setFieldErrors(error.fieldErrors);
  };

  const clearErrors = () => {
    setApiError(null);
    setFieldErrors({});
  };

  return {
    apiError,
    fieldErrors,
    isSubmitting,
    setIsSubmitting,
    isRedirectingAfterLogin,
    setIsRedirectingAfterLogin,
    showPassword,
    setShowPassword,
    setAuthErrorWithFields,
    clearErrors,
    setApiError,
    setFieldErrors,
  };
}

function LoginStyles() {
  return (
    <style>{`
.fmz-login-shell *, .fmz-login-shell *::before, .fmz-login-shell *::after{box-sizing:border-box;margin:0;padding:0}
.fmz-login-shell{--gold:#E8B620;--gold-soft:#F5D26B;--gold-tint:#FBF3DA;--gold-deep:#8A6B12;--navy:#1A1612;--navy-2:#2A2419;--ink:#2A2419;--muted:#6B6357;--hint:#9A9385;--line:#EAE5DC;--page:#F7F3EA;--cream:#FBF7EE;--cream-2:#F4EEDF;--white:#FFFFFF;--green:#127A4F;--green-tint:#E8F5EE;--red:#B23B2D;--red-tint:#FBEDEB;--shadow-sm:0 1px 2px rgba(14,22,38,.04),0 1px 0 rgba(14,22,38,.02);font-family:var(--font-inter),Inter,system-ui,sans-serif;background:var(--page);color:var(--ink);font-size:15px;line-height:1.5;min-height:100vh;display:flex;flex-direction:column;overflow-x:hidden;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}.fmz-login-shell button,.fmz-login-shell a,.fmz-login-shell input{font-family:inherit;color:inherit}.fmz-login-shell a{text-decoration:none}.fmz-login-shell .nav{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:0 clamp(20px,4vw,40px);height:68px;background:rgba(255,255,255,.92);backdrop-filter:saturate(140%) blur(10px);-webkit-backdrop-filter:saturate(140%) blur(10px);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:100}.fmz-login-shell .nav-l{display:flex;align-items:center;gap:14px;min-width:0}.fmz-login-shell .logo{display:flex;align-items:center;gap:11px;min-width:0}.fmz-login-shell .logo-mark{width:38px;height:38px;border-radius:10px;background:var(--gold);display:grid;place-items:center;flex-shrink:0;box-shadow:0 6px 14px rgba(232,182,32,.32),inset 0 -2px 0 rgba(14,22,38,.06)}.fmz-login-shell .logo-mark svg{width:20px;height:20px}.fmz-login-shell .logo-text{font-weight:700;font-size:16.5px;color:var(--navy);letter-spacing:-.02em;white-space:nowrap;line-height:1}.fmz-login-shell .logo-divider{width:1px;height:22px;background:var(--line);margin:0 4px;flex-shrink:0}.fmz-login-shell .logo-context{font-size:12.5px;color:var(--muted);font-weight:500;white-space:nowrap;line-height:1;display:flex;align-items:center;gap:7px}.fmz-login-shell .logo-context::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--gold);box-shadow:0 0 0 3px rgba(232,182,32,.22)}.fmz-login-shell .logo-context strong{color:var(--navy);font-weight:600}.fmz-login-shell .nav-r{display:flex;align-items:center;gap:14px;font-size:13px;color:var(--muted)}.fmz-login-shell .nav-r .nv-q{display:none}@media (min-width:560px){.fmz-login-shell .nav-r .nv-q{display:inline}}.fmz-login-shell .nv-link{font-size:13px;color:var(--navy);font-weight:600;display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;border:1.5px solid var(--line);background:var(--white);transition:border-color .15s,transform .15s,box-shadow .15s}.fmz-login-shell .nv-link:hover{border-color:var(--navy);transform:translateY(-1px);box-shadow:0 6px 18px rgba(14,22,38,.08)}.fmz-login-shell .nv-link svg{width:13px;height:13px;color:var(--gold-deep)}.fmz-login-shell .shell{flex:1;display:grid;grid-template-columns:minmax(360px,1fr) minmax(420px,1fr);min-height:calc(100vh - 68px);align-items:stretch;width:100%;max-width:none;margin:0;background:var(--white)}.fmz-login-shell .side{position:relative;overflow:hidden;background:linear-gradient(180deg,var(--cream) 0%,var(--cream-2) 100%);color:var(--ink);padding:clamp(40px,5vw,72px) clamp(40px,5vw,88px) clamp(32px,4vw,48px) clamp(24px,3vw,56px);display:flex;flex-direction:column;align-items:flex-end;justify-content:center;min-height:calc(100vh - 68px);border-right:1px solid var(--line)}.fmz-login-shell .side>div,.fmz-login-shell .side-foot{width:min(100%,480px);margin-left:0}.fmz-login-shell .side::before{content:'';position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(to right,rgba(14,22,38,.04) 1px,transparent 1px),linear-gradient(to bottom,rgba(14,22,38,.04) 1px,transparent 1px);background-size:42px 42px;mask-image:radial-gradient(circle at 30% 40%,black 0%,transparent 80%);-webkit-mask-image:radial-gradient(circle at 30% 40%,black 0%,transparent 80%)}.fmz-login-shell .side::after{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(60% 50% at 110% -10%,rgba(232,182,32,.22) 0%,transparent 60%),radial-gradient(50% 50% at -10% 110%,rgba(232,182,32,.10) 0%,transparent 60%)}.fmz-login-shell .side-geo{position:absolute;inset:0;pointer-events:none;opacity:.10}.fmz-login-shell .side-geo svg{position:absolute;bottom:-90px;right:-80px;color:var(--navy)}.fmz-login-shell .side>*{position:relative;z-index:1}.fmz-login-shell .eyebrow-dark{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--gold-deep);margin-bottom:28px}.fmz-login-shell .eyebrow-dark::before{content:'';width:18px;height:1.5px;background:var(--gold);border-radius:1px}.fmz-login-shell .side h1{font-weight:800;font-size:clamp(30px,3.4vw,44px);line-height:1.05;letter-spacing:-.035em;color:var(--navy);margin-bottom:20px;max-width:480px}.fmz-login-shell .side h1 em{font-style:normal;background:linear-gradient(135deg,var(--gold-deep) 0%,var(--gold) 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}.fmz-login-shell .lede{font-size:14.5px;line-height:1.6;color:var(--muted);max-width:420px;margin-bottom:36px}.fmz-login-shell .summary{max-width:480px;margin-bottom:28px;background:rgba(255,255,255,.65);border:1px solid var(--line);border-radius:14px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:18px 20px;display:flex;flex-direction:column;gap:14px}.fmz-login-shell .summary-head{display:flex;align-items:center;justify-content:space-between}.fmz-login-shell .sh-l{display:flex;align-items:center;gap:10px}.fmz-login-shell .sh-dot{width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 0 3px rgba(18,122,79,.18)}.fmz-login-shell .sh-title{font-size:12px;font-weight:600;color:var(--navy);letter-spacing:-.005em}.fmz-login-shell .sh-meta{font-size:10.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}.fmz-login-shell .summary-num{font-weight:800;font-size:34px;color:var(--navy);letter-spacing:-.035em;line-height:1}.fmz-login-shell .summary-num .cents{color:var(--muted);font-weight:600;font-size:20px;letter-spacing:-.02em}.fmz-login-shell .summary-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:14px;border-top:1px dashed var(--line);font-size:12px;color:var(--muted)}.fmz-login-shell .chip{display:inline-flex;align-items:center;gap:6px;background:var(--green-tint);color:var(--green);font-size:11.5px;font-weight:700;letter-spacing:-.005em;padding:4px 9px;border-radius:999px}.fmz-login-shell .chip svg{width:10px;height:10px}.fmz-login-shell .tokens{display:flex;flex-direction:column;gap:8px;max-width:480px}.fmz-login-shell .tk{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:11px;background:rgba(255,255,255,.55);border:1px solid var(--line);transition:background .2s,border-color .2s,transform .2s}.fmz-login-shell .tk:hover{background:var(--white);border-color:rgba(232,182,32,.45);transform:translateX(2px)}.fmz-login-shell .tk-thumb{width:38px;height:38px;border-radius:9px;flex-shrink:0;background:linear-gradient(135deg,var(--gold-tint),var(--cream-2));border:1px solid rgba(232,182,32,.25);display:grid;place-items:center;color:var(--gold-deep)}.fmz-login-shell .tk-thumb svg{width:16px;height:16px}.fmz-login-shell .tk-body{flex:1;min-width:0}.fmz-login-shell .tk-body strong{display:block;font-size:13px;font-weight:600;color:var(--navy);letter-spacing:-.01em}.fmz-login-shell .tk-body span{font-size:11.5px;color:var(--muted)}.fmz-login-shell .tk-right{text-align:right;flex-shrink:0}.fmz-login-shell .tk-right .v{font-weight:700;font-size:13px;color:var(--navy);letter-spacing:-.01em}.fmz-login-shell .tk-right .k{font-size:10.5px;color:var(--muted);font-weight:500}.fmz-login-shell .side-foot{margin-top:32px;padding-top:24px;border-top:1px solid var(--line);display:flex;align-items:center;gap:10px;max-width:480px;font-size:11px;color:var(--muted);font-weight:500;letter-spacing:.02em}.fmz-login-shell .side-foot svg{width:13px;height:13px;color:var(--gold-deep)}.fmz-login-shell .form-col{background:var(--white);display:flex;flex-direction:column;align-items:flex-start;justify-content:center;padding:clamp(40px,5vw,72px) clamp(24px,4vw,56px) clamp(40px,5vw,72px) clamp(40px,5vw,88px);position:relative;min-height:calc(100vh - 68px)}.fmz-login-shell .form-inner{width:min(100%,440px);margin:0;display:flex;flex-direction:column}.fmz-login-shell .fh{margin-bottom:30px}.fmz-login-shell .fh-eyebrow{display:inline-flex;align-items:center;gap:7px;font-size:10.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--gold-deep);margin-bottom:12px}.fmz-login-shell .e-ico{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:5px;background:var(--gold-tint);color:var(--gold-deep)}.fmz-login-shell .e-ico svg{width:10px;height:10px}.fmz-login-shell .fh h2{font-weight:700;font-size:clamp(26px,3vw,32px);letter-spacing:-.035em;line-height:1.1;color:var(--navy);margin-bottom:8px;text-wrap:pretty}.fmz-login-shell .fh .sub{font-size:13.5px;color:var(--muted);line-height:1.55;max-width:380px}.fmz-login-shell .stack{display:flex;flex-direction:column;gap:16px}.fmz-login-shell .f{display:flex;flex-direction:column;gap:6px}.fmz-login-shell .label-row{display:flex;align-items:center;justify-content:space-between;gap:8px}.fmz-login-shell label{font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:4px}.fmz-login-shell .req{color:var(--red);margin-left:2px}.fmz-login-shell .label-row a{font-size:11.5px;font-weight:600;color:var(--gold-deep);text-transform:none;letter-spacing:0;border-bottom:1px dashed transparent;transition:border-color .15s}.fmz-login-shell .label-row a:hover{border-color:var(--gold)}.fmz-login-shell .iw{position:relative}.fmz-login-shell .il{position:absolute;left:12px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--hint);pointer-events:none;transition:color .2s}.fmz-login-shell .ir{position:absolute;right:10px;top:50%;transform:translateY(-50%);width:28px;height:28px;color:var(--hint);cursor:pointer;background:none;border:none;padding:0;border-radius:7px;transition:color .15s,background .15s;display:grid;place-items:center}.fmz-login-shell .ir:hover{color:var(--navy);background:var(--page)}.fmz-login-shell .ir svg{width:14px;height:14px}.fmz-login-shell input[type=email],.fmz-login-shell input[type=password]{width:100%;border:1.5px solid var(--line);border-radius:11px;padding:13px 14px;font-size:14.5px;font-family:inherit;color:var(--navy);background:var(--white);transition:all .15s;outline:none}.fmz-login-shell .iw input{padding-left:38px}.fmz-login-shell .iw.hr input{padding-right:42px}.fmz-login-shell input:hover:not(:focus){border-color:#D0D4DE}.fmz-login-shell input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(232,182,32,.20)}.fmz-login-shell .iw:focus-within .il{color:var(--gold-deep)}.fmz-login-shell input.invalid{border-color:var(--red);box-shadow:0 0 0 3px rgba(178,59,45,.12)}.fmz-login-shell input::placeholder{color:var(--hint)}.fmz-login-shell .hint{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:var(--muted);min-height:16px;line-height:1.3}.fmz-login-shell .hint svg{width:11px;height:11px;flex-shrink:0}.fmz-login-shell .hint.err{color:var(--red)}.fmz-login-shell .opt-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:2px;flex-wrap:wrap}.fmz-login-shell .remember{display:inline-flex;align-items:center;gap:9px;font-size:12.5px;color:var(--ink);font-weight:500;cursor:pointer;user-select:none}.fmz-login-shell .remember input{width:16px;height:16px;accent-color:var(--navy);cursor:pointer}.fmz-login-shell .help-link{font-size:12px;font-weight:600;color:var(--muted);display:inline-flex;align-items:center;gap:5px;background:none;border:none;cursor:pointer}.fmz-login-shell .help-link:hover{color:var(--navy)}.fmz-login-shell .help-link svg{width:11px;height:11px}.fmz-login-shell .err-banner{display:none;align-items:flex-start;gap:10px;padding:11px 13px;background:var(--red-tint);border:1px solid rgba(178,59,45,.20);border-radius:10px;font-size:12.5px;color:var(--red);line-height:1.45;margin-bottom:18px}.fmz-login-shell .err-banner.show{display:flex}.fmz-login-shell .err-banner svg{width:14px;height:14px;flex-shrink:0;margin-top:1px}.fmz-login-shell .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:14px 22px;border-radius:11px;font-family:inherit;font-size:13.5px;font-weight:600;letter-spacing:.005em;cursor:pointer;border:1.5px solid transparent;transition:all .15s;white-space:nowrap}.fmz-login-shell .btn svg{width:14px;height:14px}.fmz-login-shell .btn:active{transform:scale(.98)}.fmz-login-shell .btn-primary{background:var(--navy);color:var(--white);border-color:var(--navy)}.fmz-login-shell .btn-primary:hover{background:var(--navy-2);border-color:var(--navy-2);transform:translateY(-1px);box-shadow:0 8px 22px rgba(14,22,38,.22)}.fmz-login-shell .btn-primary:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none}.fmz-login-shell .btn-full{width:100%}.fmz-login-shell .submit-row{margin-top:24px}.fmz-login-shell .signup-nudge{margin-top:26px;padding:14px 16px;border:1px dashed var(--line);border-radius:12px;background:var(--cream);display:flex;align-items:center;justify-content:space-between;gap:12px}.fmz-login-shell .signup-nudge .t{font-size:12.5px;color:var(--muted);line-height:1.4}.fmz-login-shell .signup-nudge .t strong{color:var(--navy);font-weight:600;display:block;margin-bottom:1px;font-size:13px}.fmz-login-shell .signup-nudge a{font-size:12.5px;font-weight:600;color:var(--navy);display:inline-flex;align-items:center;gap:5px;padding:8px 12px;border-radius:9px;border:1.5px solid var(--navy);background:var(--white);transition:all .15s;white-space:nowrap;flex-shrink:0}.fmz-login-shell .signup-nudge a:hover{background:var(--navy);color:var(--white)}.fmz-login-shell .signup-nudge a svg{width:11px;height:11px}.fmz-login-shell .alt-login{margin-top:18px;padding-top:18px;border-top:1px dashed var(--line);text-align:center;font-size:12.5px;color:var(--muted)}.fmz-login-shell .alt-login a{color:var(--navy);font-weight:600;border-bottom:1px solid var(--line)}.fmz-login-shell footer{border-top:1px solid var(--line);background:var(--white);padding:0;display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:12px;color:var(--hint)}.fmz-login-shell .fsoc{display:flex;gap:18px}.fmz-login-shell .fsoc a{color:var(--hint);transition:color .15s}.fmz-login-shell .fsoc a:hover{color:var(--navy)}.fmz-login-shell .spinner{width:14px;height:14px;border-radius:999px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;animation:fmz-spin .75s linear infinite}@keyframes fmz-spin{to{transform:rotate(360deg)}}@media (max-width:1100px){.fmz-login-shell .shell{grid-template-columns:1fr;max-width:none}.fmz-login-shell .side{align-items:stretch;min-height:auto;padding:48px clamp(20px,5vw,40px) 56px}.fmz-login-shell .side>div,.fmz-login-shell .side-foot{width:100%;margin-left:0}.fmz-login-shell .form-col{align-items:center;min-height:auto;padding:44px 20px 56px}.fmz-login-shell .form-inner{margin:0 auto}.fmz-login-shell .summary,.fmz-login-shell .tokens,.fmz-login-shell .side-foot{max-width:none}}@media (max-width:880px){.fmz-login-shell .logo-divider,.fmz-login-shell .logo-context{display:none}}@media (max-width:560px){.fmz-login-shell .form-col{padding:32px 16px 44px}.fmz-login-shell .fh{margin-bottom:24px}.fmz-login-shell .signup-nudge{flex-direction:column;align-items:flex-start}.fmz-login-shell .signup-nudge a{width:100%;justify-content:center}.fmz-login-shell footer{flex-direction:column;align-items:flex-start}}@media (prefers-reduced-motion:reduce){.fmz-login-shell *{animation:none!important;transition:none!important}}
`}</style>
  );
}

function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <span className="hint err"><Info aria-hidden="true" /> {children}</span>;
}

export function FmzAuthAccessCard({ className = '' }: FmzAuthAccessCardProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const {
    apiError,
    fieldErrors,
    isSubmitting,
    setIsSubmitting,
    isRedirectingAfterLogin,
    setIsRedirectingAfterLogin,
    showPassword,
    setShowPassword,
    setAuthErrorWithFields,
    clearErrors,
    setApiError,
    setFieldErrors,
  } = useLoginFormState();

  const handleLogin = async (formData: Record<string, FormDataEntryValue>) => {
    buildFmzLoginSchema().parse(formData);

    const loginData: LoginType = {
      email: getFormStringValue(formData, 'email'),
      password: getFormStringValue(formData, 'password'),
      rememberMe: formData.remember === 'on',
    };

    const response = await login(loginData);

    if (!response.success) {
      if (response.error.code === FMZ_API_ERROR_CODES.EMAIL_VERIFICATION_REQUIRED) {
        sessionStorage.setItem('ft_pending_email', loginData.email);
        await router.replace('/verify-email-required');
        return;
      }
      setAuthErrorWithFields(response.error);
      return;
    }

    formRef.current?.reset();
    setIsRedirectingAfterLogin(true);
    const returnTo = new URLSearchParams(window.location.search).get('returnTo') ?? '';
    const destination = /^\/connected\/[a-z][-a-z0-9/]*$/i.test(returnTo)
      ? returnTo
      : '/connected/dashboard';
    await router.replace(destination);
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || isRedirectingAfterLogin) return;

    clearErrors();
    setIsSubmitting(true);

    const formData = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      await handleLogin(formData);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const { alertError, fieldErrors: zodFieldErrors } = buildValidationErrorState(validationError);
        setFieldErrors(zodFieldErrors);
        setApiError(alertError);
        return;
      }

      setApiError({
        code: FMZ_API_ERROR_CODES.UNKNOWN_ERROR,
        title: 'Não foi possível concluir a solicitação',
        description: 'Tente novamente em instantes. Se o problema continuar, entre em contato com o suporte.',
        severity: 'error',
        fieldErrors: {},
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRedirectingAfterLogin) {
    return (
      <FmzFullPageLoading
        label="Entrando na plataforma..."
        description="Estamos carregando sua sessão, permissões e menu lateral."
        className="min-h-screen bg-white"
      />
    );
  }

  return (
    <div className={`fmz-login-shell ${className}`}>
      <LoginStyles />

      <FmzAuthHeader
        ariaLabel="Navegação do login"
        helperText="Ainda não tem conta?"
        actionHref="/register"
        actionLabel="Criar conta"
        actionIcon={<UserPlus aria-hidden="true" />}
      />

      <div className="shell">
        <aside className="side">
          <div className="side-geo" aria-hidden="true">
            <svg width="540" height="540" viewBox="0 0 500 500" fill="none">
              <path d="M250 50L450 175V325L250 450L50 325V175L250 50Z" stroke="currentColor" strokeWidth="1" />
              <path d="M250 50L250 450M50 175L450 325M450 175L50 325" stroke="currentColor" strokeWidth=".5" />
              <path d="M250 130L370 205V305L250 380L130 305V205L250 130Z" stroke="currentColor" strokeWidth="1" />
              <path d="M250 210L310 245V295L250 330L190 295V245L250 210Z" stroke="currentColor" strokeWidth="1" />
            </svg>
          </div>

          <div>
            <span className="eyebrow-dark">Bem-vindo de volta</span>
            <h1>Continue construindo<br />seu <em>patrimônio</em>,<br />token a token.</h1>
          </div>
        </aside>

        <main className="form-col">
          <div className="form-inner">
            <div className="fh">
              <span className="fh-eyebrow"><span className="e-ico"><Lock aria-hidden="true" /></span>Acesso à plataforma</span>
              <h2>Entre na sua conta</h2>
              <p className="sub">Use o e-mail cadastrado e sua senha para acessar a carteira, comprar tokens e acompanhar o seu imóvel.</p>
            </div>

            {apiError ? (
              <div className="err-banner show" role="alert">
                <Info aria-hidden="true" />
                <span>{apiError.description || apiError.title || 'Não foi possível acessar sua conta.'}</span>
              </div>
            ) : null}

            <form ref={formRef} onSubmit={handleFormSubmit} aria-busy={isSubmitting}>
              <div className="stack">
                <div className="f">
                  <label htmlFor="email">E-mail <span className="req">*</span></label>
                  <div className="iw">
                    <Mail className="il" aria-hidden="true" />
                    <input id="email" name="email" type="email" placeholder="seu@email.com" autoComplete="email" className={fieldErrors.email ? 'invalid' : undefined} />
                  </div>
                  <FieldError>{fieldErrors.email}</FieldError>
                </div>

                <div className="f">
                  <div className="label-row">
                    <label htmlFor="password">Senha <span className="req">*</span></label>
                    <Link href="/request-password-reset">Esqueci minha senha</Link>
                  </div>
                  <div className="iw hr">
                    <Lock className="il" aria-hidden="true" />
                    <input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Digite sua senha" autoComplete="current-password" className={fieldErrors.password ? 'invalid' : undefined} />
                    <button className="ir" type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff /> : <Eye />}</button>
                  </div>
                  <FieldError>{fieldErrors.password}</FieldError>
                </div>

                <div className="opt-row">
                  <label className="remember" htmlFor="remember">
                    <input id="remember" name="remember" type="checkbox" />
                    Manter conectado neste dispositivo
                  </label>
                </div>
              </div>

              <div className="submit-row">
                <button className="btn btn-primary btn-full" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <span className="spinner" aria-hidden="true" /> : null}
                  {isSubmitting ? 'Validando acesso...' : 'Entrar na conta'}
                </button>
              </div>
            </form>

            <div className="signup-nudge">
              <div className="t">
                <strong>Primeira vez na Propya?</strong>
                <span>Crie sua conta em menos de 1 minuto e comece com R$ 100.</span>
              </div>
              <Link href="/register">Criar conta <UserPlus aria-hidden="true" /></Link>
            </div>

            <div className="alt-login">Está com problemas? <a href="mailto:suporte@firmezatoken.com">Fale com a gente</a></div>
          </div>
        </main>
      </div>

      <FmzPublicFooter />
    </div>
  );
}
