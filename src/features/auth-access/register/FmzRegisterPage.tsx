'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Home,
  Info,
  Lock,
  Mail,
  Phone,
  Shield,
  TrendingUp,
  User,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '../../../i18n/navigation';
import { FmzAuthHeader } from '../../../components/layout';
import { registerUser } from './fmz-register-api';
import {
  computePasswordStrength,
  hasErrors,
  validateStep1,
  validateStep2,
} from './fmz-register-validation';
import type { RegisterAllErrors, RegisterFormData } from './fmz-register.types';

const INITIAL_FORM_DATA: RegisterFormData = {
  email: '',
  password: '',
  passwordConfirmation: '',
  phone: '',
  phoneCountry: 'BR',
  fullName: '',
  registrationIntent: 'coOwner',
  acceptedTerms: false,
  acceptedPrivacyPolicy: false,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RegisterStyles() {
  return (
    <style>{`

.firmeza-register-shell *, .firmeza-register-shell *::before, .firmeza-register-shell *::after{box-sizing:border-box;margin:0;padding:0}
.firmeza-register-shell{--gold:#E8B620;--gold-soft:#F5D26B;--gold-tint:#FBF3DA;--gold-deep:#8A6B12;--navy:#1A1612;--navy-2:#2A2419;--ink:#2A2419;--muted:#6B6357;--hint:#9A9385;--line:#EAE5DC;--page:#F7F3EA;--cream:#FBF7EE;--cream-2:#F4EEDF;--white:#FFFFFF;--green:#127A4F;--green-tint:#E8F5EE;--red:#B23B2D;--red-tint:#FBEDEB;--blue:#1F5BD6;--blue-tint:#E8EFFC;font-family:'Inter',system-ui,sans-serif;background:var(--page);color:var(--ink);font-size:15px;line-height:1.5;min-height:100vh;overflow-x:hidden;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}.firmeza-register-shell button,.firmeza-register-shell a,.firmeza-register-shell input{font-family:inherit;color:inherit}.firmeza-register-shell a{text-decoration:none}.firmeza-register-shell .mono{font-family:var(--font-inter),Inter,system-ui,sans-serif;font-feature-settings:'tnum'}
.firmeza-register-shell .nav{height:68px;padding:0 clamp(20px,4vw,40px);display:flex;align-items:center;justify-content:space-between;gap:18px;background:rgba(255,255,255,.92);backdrop-filter:saturate(140%) blur(10px);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:100}.firmeza-register-shell .nav-l{display:flex;align-items:center;gap:14px;min-width:0}.firmeza-register-shell .logo{display:flex;align-items:center;gap:11px;min-width:0}.firmeza-register-shell .logo-mark{width:38px;height:38px;border-radius:10px;background:var(--gold);display:grid;place-items:center;flex-shrink:0;box-shadow:0 6px 14px rgba(232,182,32,.32),inset 0 -2px 0 rgba(14,22,38,.06)}.firmeza-register-shell .logo-mark svg{width:20px;height:20px}.firmeza-register-shell .logo-text{font-weight:700;font-size:16.5px;color:var(--navy);letter-spacing:-.02em;white-space:nowrap}.firmeza-register-shell .logo-divider{width:1px;height:22px;background:var(--line);margin:0 4px;flex-shrink:0}.firmeza-register-shell .logo-context{font-size:12.5px;color:var(--muted);font-weight:500;white-space:nowrap;display:flex;align-items:center;gap:7px}.firmeza-register-shell .logo-context::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--gold);box-shadow:0 0 0 3px rgba(232,182,32,.22)}.firmeza-register-shell .logo-context strong{color:var(--navy);font-weight:600}.firmeza-register-shell .nav-r{display:flex;align-items:center;gap:14px;font-size:13px;color:var(--muted)}.firmeza-register-shell .nv-link{font-size:13px;color:var(--navy);font-weight:600;display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;border:1.5px solid var(--line);background:var(--white);transition:border-color .15s,transform .15s,box-shadow .15s}.firmeza-register-shell .nv-link:hover{border-color:var(--navy);transform:translateY(-1px);box-shadow:0 6px 18px rgba(14,22,38,.08)}.firmeza-register-shell .nv-link svg{width:13px;height:13px;color:var(--gold-deep)}
.firmeza-register-shell .shell{display:grid;grid-template-columns:minmax(360px,1fr) minmax(420px,1fr);min-height:calc(100vh - 68px);align-items:stretch;width:100%;max-width:none;margin:0;background:var(--white)}.firmeza-register-shell .side{position:relative;overflow:hidden;background:linear-gradient(180deg,var(--cream) 0%,var(--cream-2) 100%);padding:clamp(40px,5vw,72px) clamp(40px,5vw,88px) clamp(32px,4vw,48px) clamp(24px,3vw,56px);display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between;min-height:calc(100vh - 68px);border-right:1px solid var(--line)}.firmeza-register-shell .side>div,.firmeza-register-shell .side-foot{width:min(100%,480px);margin-left:auto}.firmeza-register-shell .side::before{content:'';position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(to right,rgba(26,22,18,.04) 1px,transparent 1px),linear-gradient(to bottom,rgba(26,22,18,.04) 1px,transparent 1px);background-size:42px 42px;mask-image:radial-gradient(circle at 30% 40%,black 0%,transparent 80%)}.firmeza-register-shell .side::after{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(60% 50% at 110% -10%,rgba(232,182,32,.22) 0%,transparent 60%),radial-gradient(50% 50% at -10% 110%,rgba(232,182,32,.10) 0%,transparent 60%)}.firmeza-register-shell .side>*{position:relative;z-index:1}.firmeza-register-shell .eyebrow-dark{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--gold-deep);margin-bottom:28px}.firmeza-register-shell .eyebrow-dark::before{content:'';width:18px;height:1.5px;background:var(--gold);border-radius:1px}.firmeza-register-shell .side h1{font-weight:800;font-size:clamp(30px,3.4vw,44px);line-height:1.05;letter-spacing:-.035em;color:var(--navy);margin-bottom:20px;max-width:480px}.firmeza-register-shell .side h1 em{font-style:normal;background:linear-gradient(135deg,var(--gold-deep) 0%,var(--gold) 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}.firmeza-register-shell .lede{font-size:14.5px;line-height:1.6;color:var(--muted);max-width:420px;margin-bottom:36px}.firmeza-register-shell .kpi-row{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin-bottom:36px;max-width:480px;border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.5);backdrop-filter:blur(8px)}.firmeza-register-shell .kpi{padding:14px 18px;border-right:1px solid var(--line)}.firmeza-register-shell .kpi:last-child{border-right:none}.firmeza-register-shell .kpi-v{font-weight:700;font-size:22px;color:var(--navy);letter-spacing:-.03em;line-height:1;margin-bottom:4px}.firmeza-register-shell .kpi-k{font-size:10.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}.firmeza-register-shell .feats{display:flex;flex-direction:column;gap:10px;max-width:480px}.firmeza-register-shell .feat{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-radius:12px;background:rgba(255,255,255,.55);border:1px solid var(--line)}.firmeza-register-shell .feat-ico{width:36px;height:36px;border-radius:10px;flex-shrink:0;background:var(--gold-tint);color:var(--gold-deep);display:grid;place-items:center;border:1px solid rgba(232,182,32,.30)}.firmeza-register-shell .feat-ico svg{width:16px;height:16px}.firmeza-register-shell .feat h4{font-size:13.5px;font-weight:600;color:var(--navy);letter-spacing:-.01em;margin-bottom:2px}.firmeza-register-shell .feat p{font-size:12px;color:var(--muted);line-height:1.45}.firmeza-register-shell .side-foot{margin-top:36px;padding-top:24px;border-top:1px solid var(--line);display:flex;align-items:center;gap:10px;max-width:480px;font-size:11px;color:var(--muted);font-weight:500;letter-spacing:.02em}.firmeza-register-shell .side-foot svg{width:13px;height:13px;color:var(--gold-deep)}
.firmeza-register-shell .form-col{background:var(--white);display:flex;flex-direction:column;align-items:flex-start;justify-content:center;padding:clamp(40px,5vw,72px) clamp(24px,4vw,56px) clamp(40px,5vw,72px) clamp(40px,5vw,88px);position:relative;min-height:calc(100vh - 68px)}.firmeza-register-shell .form-inner{width:min(100%,440px);max-width:440px;margin:0;display:flex;flex-direction:column}.firmeza-register-shell .stepper{display:flex;align-items:center;gap:0;margin-bottom:36px;padding:6px;background:var(--page);border:1px solid var(--line);border-radius:14px}.firmeza-register-shell .step{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:8px 10px;border-radius:10px;font-size:12px;font-weight:600;color:var(--hint);white-space:nowrap}.firmeza-register-shell .step-n{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;flex-shrink:0;font-size:10.5px;font-weight:700;background:var(--white);border:1.5px solid var(--line);color:var(--hint)}.firmeza-register-shell .step.done{color:var(--green)}.firmeza-register-shell .step.done .step-n{background:var(--green);border-color:var(--green);color:var(--white)}.firmeza-register-shell .step.active{background:var(--white);color:var(--navy);box-shadow:0 1px 2px rgba(14,22,38,.04)}.firmeza-register-shell .step.active .step-n{background:var(--navy);border-color:var(--navy);color:var(--gold)}.firmeza-register-shell .fh{margin-bottom:28px}.firmeza-register-shell .fh-eyebrow{display:inline-flex;align-items:center;gap:7px;font-size:10.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--gold-deep);margin-bottom:12px}.firmeza-register-shell .e-ico{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:5px;background:var(--gold-tint);color:var(--gold-deep)}.firmeza-register-shell .e-ico svg{width:10px;height:10px}.firmeza-register-shell .fh h2{font-weight:700;font-size:clamp(24px,3vw,30px);letter-spacing:-.035em;line-height:1.1;color:var(--navy);margin-bottom:6px}.firmeza-register-shell .sub{font-size:13.5px;color:var(--muted);line-height:1.55;max-width:380px}.firmeza-register-shell .step-body{display:none;animation:fadeUp .3s ease}.firmeza-register-shell .step-body.active{display:block}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.firmeza-register-shell .stack{display:flex;flex-direction:column;gap:14px}.firmeza-register-shell .f{display:flex;flex-direction:column;gap:6px}.firmeza-register-shell label{font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:4px}.firmeza-register-shell label .req{color:var(--red);margin-left:2px}.firmeza-register-shell .iw{position:relative}.firmeza-register-shell .iw .il{position:absolute;left:12px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--hint);pointer-events:none;transition:color .2s}.firmeza-register-shell .iw .ir{position:absolute;right:10px;top:50%;transform:translateY(-50%);width:28px;height:28px;color:var(--hint);cursor:pointer;background:none;border:none;padding:0;border-radius:7px;display:grid;place-items:center}.firmeza-register-shell .iw .ir svg{width:14px;height:14px}.firmeza-register-shell input[type=text],.firmeza-register-shell input[type=email],.firmeza-register-shell input[type=tel],.firmeza-register-shell input[type=password]{width:100%;border:1.5px solid var(--line);border-radius:11px;padding:13px 14px;font-size:14.5px;color:var(--navy);background:var(--white);transition:all .15s;outline:none}.firmeza-register-shell .iw input{padding-left:38px}.firmeza-register-shell .iw.hr input{padding-right:42px}.firmeza-register-shell input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(232,182,32,.20)}.firmeza-register-shell input.valid{border-color:var(--green);box-shadow:0 0 0 3px rgba(18,122,79,.12)}.firmeza-register-shell input.invalid{border-color:var(--red);box-shadow:0 0 0 3px rgba(178,59,45,.12)}.firmeza-register-shell input::placeholder{color:var(--hint)}.firmeza-register-shell .hint{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:var(--muted);min-height:16px;line-height:1.3}.firmeza-register-shell .hint svg{width:11px;height:11px;flex-shrink:0}.firmeza-register-shell .hint.ok{color:var(--green)}.firmeza-register-shell .hint.err{color:var(--red)}.firmeza-register-shell .pbars{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:6px}.firmeza-register-shell .pbar{height:3px;border-radius:999px;background:var(--line);transition:background .25s}.firmeza-register-shell .pbar-hint{font-size:11.5px;color:var(--muted);margin-top:6px;min-height:16px;display:inline-flex;align-items:center;gap:5px}.firmeza-register-shell .note{display:flex;align-items:flex-start;gap:9px;padding:11px 13px;background:var(--blue-tint);border:1px solid rgba(31,91,214,.15);border-radius:10px;font-size:12.5px;color:var(--blue);line-height:1.45}.firmeza-register-shell .note.gold{background:var(--gold-tint);border-color:rgba(232,182,32,.30);color:var(--gold-deep)}.firmeza-register-shell .note svg{width:14px;height:14px;flex-shrink:0;margin-top:1px}.firmeza-register-shell .terms-row{display:flex;align-items:flex-start;gap:11px;padding:14px 16px;background:var(--page);border:1px solid var(--line);border-radius:11px;cursor:pointer;transition:border-color .15s,background .15s;text-transform:none;letter-spacing:0}.firmeza-register-shell .terms-row input[type=checkbox]{width:17px;height:17px;flex-shrink:0;margin-top:1px;accent-color:var(--navy);cursor:pointer}.firmeza-register-shell .terms-row span{font-size:12.5px;color:var(--muted);line-height:1.5;font-weight:400}.firmeza-register-shell .terms-row span a{color:var(--navy);font-weight:600;border-bottom:1px solid var(--line)}.firmeza-register-shell .review{display:flex;flex-direction:column;gap:8px;margin-bottom:6px}.firmeza-register-shell .rv{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid var(--line);border-radius:11px;background:var(--white)}.firmeza-register-shell .rv-ico{width:32px;height:32px;border-radius:9px;background:var(--page);color:var(--navy);display:grid;place-items:center;flex-shrink:0}.firmeza-register-shell .rv-ico svg{width:14px;height:14px}.firmeza-register-shell .rv-body{flex:1;min-width:0}.firmeza-register-shell .rv-k{font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:2px}.firmeza-register-shell .rv-v{font-size:13.5px;color:var(--navy);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.firmeza-register-shell .rv-edit{font-size:11.5px;font-weight:600;color:var(--gold-deep);cursor:pointer;background:none;border:none;padding:6px 10px;border-radius:7px}.firmeza-register-shell .btn-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:28px;flex-wrap:wrap}.firmeza-register-shell .req-note{font-size:11.5px;color:var(--hint);display:inline-flex;align-items:center;gap:4px}.firmeza-register-shell .req-note::before{content:'*';color:var(--red);font-weight:700}.firmeza-register-shell .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 22px;border-radius:11px;font-size:13.5px;font-weight:600;cursor:pointer;border:1.5px solid transparent;transition:all .15s;white-space:nowrap}.firmeza-register-shell .btn svg{width:14px;height:14px}.firmeza-register-shell .btn:active{transform:scale(.98)}.firmeza-register-shell .btn-ghost{background:var(--white);border-color:var(--line);color:var(--navy)}.firmeza-register-shell .btn-ghost:hover{background:#FAFBFC;border-color:#D0D4DE}.firmeza-register-shell .btn-primary{background:var(--navy);color:var(--white);border-color:var(--navy)}.firmeza-register-shell .btn-primary:hover{background:var(--navy-2);border-color:var(--navy-2);transform:translateY(-1px);box-shadow:0 8px 22px rgba(14,22,38,.22)}.firmeza-register-shell .btn-primary:disabled,.firmeza-register-shell .btn-gold:disabled{opacity:.45;cursor:not-allowed;transform:none;box-shadow:none}.firmeza-register-shell .btn-gold{background:var(--gold);color:var(--navy);border-color:var(--gold)}.firmeza-register-shell .btn-gold:hover{background:var(--gold-soft);border-color:var(--gold-soft);transform:translateY(-1px);box-shadow:0 8px 22px rgba(232,182,32,.40)}.firmeza-register-shell .btn-full{width:100%}.firmeza-register-shell .alt-login{margin-top:22px;padding-top:22px;border-top:1px dashed var(--line);text-align:center;font-size:12.5px;color:var(--muted)}.firmeza-register-shell .alt-login a{color:var(--navy);font-weight:600;border-bottom:1px solid var(--line)}.firmeza-register-shell .success-wrap{text-align:center;padding:8px 0}.firmeza-register-shell .s-ico{width:84px;height:84px;border-radius:50%;background:var(--green-tint);color:var(--green);display:grid;place-items:center;margin:0 auto 22px;position:relative}.firmeza-register-shell .s-ico svg{width:34px;height:34px}.firmeza-register-shell .s-title{font-weight:700;font-size:26px;color:var(--navy);letter-spacing:-.035em;margin-bottom:8px}.firmeza-register-shell .s-sub{font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:28px}.firmeza-register-shell .s-sub strong{color:var(--navy);font-weight:600}.firmeza-register-shell .s-items{display:flex;flex-direction:column;gap:10px;text-align:left;margin-bottom:28px}.firmeza-register-shell .error-box{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:11px;background:var(--red-tint);color:var(--red);font-size:12.5px;line-height:1.45;border:1px solid rgba(178,59,45,.18);margin-top:14px}.firmeza-register-shell .spinner{width:14px;height:14px;border:2px solid rgba(255,255,255,.45);border-top-color:var(--white);border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.firmeza-register-shell footer{border-top:1px solid var(--line);background:var(--white);padding:16px clamp(20px,4vw,40px);display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:12px;color:var(--hint)}.firmeza-register-shell .fsoc{display:flex;gap:18px}.firmeza-register-shell .fsoc a{color:var(--hint);transition:color .15s}.firmeza-register-shell .fsoc a:hover{color:var(--navy)}
@media (max-width:1100px){.firmeza-register-shell .shell{grid-template-columns:1fr;max-width:none}.firmeza-register-shell .side{align-items:stretch;min-height:auto;padding:48px clamp(20px,5vw,40px) 56px}.firmeza-register-shell .side>div,.firmeza-register-shell .side-foot{width:100%;margin-left:0}.firmeza-register-shell .form-col{align-items:center;min-height:auto;padding:44px 20px 56px}.firmeza-register-shell .form-inner{margin:0 auto}.firmeza-register-shell .kpi-row,.firmeza-register-shell .feats,.firmeza-register-shell .side-foot{max-width:none}}@media (max-width:880px){.firmeza-register-shell .logo-divider,.firmeza-register-shell .logo-context{display:none}}@media (max-width:560px){.firmeza-register-shell .form-col{padding:32px 16px 44px}.firmeza-register-shell .fh{margin-bottom:24px}.firmeza-register-shell .stepper{padding:4px}.firmeza-register-shell .step{padding:7px 6px;font-size:11px}.firmeza-register-shell .step-label-txt{display:none}.firmeza-register-shell .btn-row{flex-direction:column-reverse}.firmeza-register-shell .btn-row .btn{width:100%}.firmeza-register-shell .req-note{align-self:flex-start}.firmeza-register-shell .kpi-row{grid-template-columns:1fr 1fr}.firmeza-register-shell .kpi:nth-child(3){display:none}.firmeza-register-shell footer{flex-direction:column;align-items:flex-start}}@media (prefers-reduced-motion:reduce){.firmeza-register-shell *{animation:none!important;transition:none!important}}
`}</style>
  );
}

function classNames(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(' ');
}

function getStepClass(step: number, currentStep: number) {
  if (currentStep > step) return 'step done';
  if (currentStep === step) return 'step active';
  return 'step';
}

function getStepNumber(step: number, currentStep: number) {
  return currentStep > step ? <Check size={12} aria-hidden="true" /> : step;
}

function formatPhone(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (!digits) return '';
  if (!digits.startsWith('55') && digits.length >= 10 && digits.length <= 11) digits = `55${digits}`;
  if (digits.startsWith('55')) {
    const country = digits.slice(0, 2);
    const ddd = digits.slice(2, 4);
    const first = digits.length > 12 ? digits.slice(4, 9) : digits.slice(4, 8);
    const second = digits.length > 12 ? digits.slice(9, 13) : digits.slice(8, 12);
    return ['+', country, ddd, first && `${first}${second ? `-${second}` : ''}`].filter(Boolean).join(' ');
  }
  return `+${digits.slice(0, 15)}`;
}

function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <span className="hint err"><Info aria-hidden="true" /> {children}</span>;
}

function ReviewItem({ icon, title, value, onEdit, mono }: { icon: ReactNode; title: string; value: string; onEdit?: () => void; mono?: boolean }) {
  return (
    <div className="rv">
      <div className="rv-ico">{icon}</div>
      <div className="rv-body">
        <div className="rv-k">{title}</div>
        <div className={classNames('rv-v', mono && 'mono')}>{value || '—'}</div>
      </div>
      {onEdit ? <button className="rv-edit" type="button" onClick={onEdit}>Editar</button> : null}
    </div>
  );
}

export function FmzRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // D-14 / AE-13: carries no other behavior on this page — does not pre-fill any other
  // field, only forwarded as `inviteId` in the register payload (best-effort on the backend).
  const inviteId = searchParams.get('invite') || undefined;
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RegisterFormData>({ ...INITIAL_FORM_DATA, inviteId });
  const [errors, setErrors] = useState<RegisterAllErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordStrength = useMemo(() => computePasswordStrength(formData.password), [formData.password]);
  const step1Errors = useMemo(() => validateStep1(formData), [formData]);
  const step2Errors = useMemo(() => validateStep2(formData), [formData]);
  const step1Ready = !hasErrors(step1Errors);
  const step2Ready = !hasErrors(step2Errors);
  const isEmailValid = EMAIL_PATTERN.test(formData.email.trim());
  const passwordsMatch = Boolean(formData.passwordConfirmation) && formData.password === formData.passwordConfirmation;

  const updateField = <K extends keyof RegisterFormData>(field: K, value: RegisterFormData[K]) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, general: undefined }));
  };

  const updateTerms = (checked: boolean) => {
    setFormData((current) => ({ ...current, acceptedTerms: checked, acceptedPrivacyPolicy: checked }));
    setErrors((current) => ({ ...current, terms: undefined, general: undefined }));
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextStep1 = () => {
    const nextErrors = validateStep1(formData);
    setErrors((current) => ({ ...current, ...nextErrors }));
    if (!hasErrors(nextErrors)) goToStep(2);
  };

  const nextStep2 = () => {
    const nextErrors = validateStep2(formData);
    setErrors((current) => ({ ...current, ...nextErrors }));
    if (!hasErrors(nextErrors)) goToStep(3);
  };

  const handleSubmit = async () => {
    const allErrors = { ...validateStep1(formData), ...validateStep2(formData) };
    setErrors(allErrors);
    if (hasErrors(allErrors)) return;

    setIsSubmitting(true);
    try {
      const result = await registerUser(formData);

      if (!result.success) {
        setErrors({
          ...result.error.fieldErrors,
          general: result.error.description || result.error.title || 'Não foi possível criar sua conta agora.',
        });
        return;
      }

      sessionStorage.setItem('ft_pending_email', formData.email.trim());
      router.replace('/verify-email-required');
    } catch {
      setErrors({ general: 'Não foi possível criar sua conta agora. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordLabels = ['Use letras maiúsculas, números e símbolos', 'Senha fraca — adicione complexidade', 'Razoável — pode melhorar', 'Boa senha', 'Senha forte'];
  const passwordColors = ['', '#B23B2D', '#E8B620', '#8A6B12', '#127A4F'];

  return (
    <div className="firmeza-register-shell">
      <RegisterStyles />

      <FmzAuthHeader
        ariaLabel="Navegação do cadastro"
        contextLabel="Criar conta"
        helperText="Já tem uma conta?"
        actionHref="/"
        actionLabel="Entrar"
      />

      <div className="shell">
        <aside className="side">
          <div>
            <span className="eyebrow-dark">Plataforma de Tokenização</span>
            <h1>Sua casa, sua<br />parte, sua<br /><em>liberdade</em>.</h1>
            <p className="lede">Compre frações tokenizadas do imóvel onde mora ou invista a partir de R$ 100. Reduza seu aluguel a cada token e construa patrimônio no seu ritmo.</p>

            <div className="kpi-row" aria-label="Indicadores da plataforma">
              <div className="kpi"><div className="kpi-v">4.800+</div><div className="kpi-k">Investidores</div></div>
              <div className="kpi"><div className="kpi-v">R$ 48M</div><div className="kpi-k">Tokenizado</div></div>
              <div className="kpi"><div className="kpi-v">12+</div><div className="kpi-k">Imóveis</div></div>
            </div>

            <div className="feats">
              <div className="feat"><div className="feat-ico"><Shield aria-hidden="true" /></div><div><h4>Segurança em blockchain</h4><p>Cada token é um registro auditável da sua fração do imóvel.</p></div></div>
              <div className="feat"><div className="feat-ico"><TrendingUp aria-hidden="true" /></div><div><h4>Aluguel que diminui</h4><p>A cada token, sua mensalidade cai proporcionalmente à posse.</p></div></div>
              <div className="feat"><div className="feat-ico"><Home aria-hidden="true" /></div><div><h4>Caminho para a casa própria</h4><p>Construa patrimônio token a token até alcançar 100% do imóvel.</p></div></div>
            </div>
          </div>

          <div className="side-foot"><Lock aria-hidden="true" /> Criptografia ponta-a-ponta · LGPD</div>
        </aside>

        <main className="form-col">
          <div className="form-inner">
            <div className="stepper" aria-label="Etapas do cadastro">
              {[1, 2, 3].map((step) => (
                <div key={step} className={getStepClass(step, currentStep)}>
                  <span className="step-n">{getStepNumber(step, currentStep)}</span>
                  <span className="step-label-txt">{step === 1 ? 'Acesso' : step === 2 ? 'Identidade' : 'Confirmar'}</span>
                </div>
              ))}
            </div>

            <section className={classNames('step-body', currentStep === 1 && 'active')}>
              <div className="fh">
                <span className="fh-eyebrow"><span className="e-ico"><Lock aria-hidden="true" /></span>Passo 1 de 3</span>
                <h2>Crie seu acesso</h2>
                <p className="sub">E-mail, nome completo e telefone. Leva menos de 1 minuto.</p>
              </div>

              <div className="stack">
                <div className="f">
                  <label htmlFor="email">E-mail <span className="req">*</span></label>
                  <div className="iw">
                    <Mail className="il" aria-hidden="true" />
                    <input id="email" type="email" placeholder="seu@email.com" autoComplete="email" value={formData.email} onChange={(event) => updateField('email', event.target.value)} className={classNames(formData.email && isEmailValid && 'valid', formData.email && !isEmailValid && 'invalid')} />
                  </div>
                  {formData.email && isEmailValid ? <span className="hint ok"><Check aria-hidden="true" /> E-mail válido</span> : <FieldError>{errors.email}</FieldError>}
                </div>

                <div className="f">
                  <label htmlFor="senha">Senha <span className="req">*</span></label>
                  <div className="iw hr">
                    <Lock className="il" aria-hidden="true" />
                    <input id="senha" type={showPassword ? 'text' : 'password'} placeholder="Mínimo 8 caracteres" autoComplete="new-password" value={formData.password} onChange={(event) => updateField('password', event.target.value)} />
                    <button className="ir" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff /> : <Eye />}</button>
                  </div>
                  <div className="pbars" aria-hidden="true">
                    {[1, 2, 3, 4].map((bar) => <div key={bar} className="pbar" style={{ background: bar <= passwordStrength ? passwordColors[passwordStrength] : undefined }} />)}
                  </div>
                  <div className="pbar-hint" style={{ color: passwordColors[passwordStrength] || undefined }}>{passwordStrength === 4 ? <Check size={11} aria-hidden="true" /> : null}{passwordLabels[passwordStrength]}</div>
                  <FieldError>{errors.password}</FieldError>
                </div>

                <div className="f">
                  <label htmlFor="senha2">Confirmar senha <span className="req">*</span></label>
                  <div className="iw hr">
                    <Lock className="il" aria-hidden="true" />
                    <input id="senha2" type={showPasswordConfirmation ? 'text' : 'password'} placeholder="Repita a senha" autoComplete="new-password" value={formData.passwordConfirmation} onChange={(event) => updateField('passwordConfirmation', event.target.value)} className={classNames(formData.passwordConfirmation && passwordsMatch && 'valid', formData.passwordConfirmation && !passwordsMatch && 'invalid')} />
                    <button className="ir" type="button" onClick={() => setShowPasswordConfirmation((value) => !value)} aria-label={showPasswordConfirmation ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}>{showPasswordConfirmation ? <EyeOff /> : <Eye />}</button>
                  </div>
                  {formData.passwordConfirmation && passwordsMatch ? <span className="hint ok"><Check aria-hidden="true" /> Senhas conferem</span> : <FieldError>{errors.passwordConfirmation}</FieldError>}
                </div>

                <div className="f">
                  <label htmlFor="phone">Telefone <span className="req">*</span></label>
                  <div className="iw">
                    <Phone className="il" aria-hidden="true" />
                    <input id="phone" type="tel" placeholder="+55 11 91234-5678" autoComplete="tel" value={formData.phone} onChange={(event) => updateField('phone', formatPhone(event.target.value))} />
                  </div>
                  <span className="hint"><Info aria-hidden="true" /> Usado apenas para verificação em duas etapas</span>
                  <FieldError>{errors.phone}</FieldError>
                </div>

                <label className="terms-row" htmlFor="terms">
                  <input id="terms" type="checkbox" checked={formData.acceptedTerms && formData.acceptedPrivacyPolicy} onChange={(event) => updateTerms(event.target.checked)} />
                  <span>Li e concordo com os <a href="/terms" target="_blank" rel="noopener noreferrer">Termos de Uso</a> e a <a href="/privacy" target="_blank" rel="noopener noreferrer">Política de Privacidade</a> da Propya.</span>
                </label>
                <FieldError>{errors.terms}</FieldError>
              </div>

              <div className="btn-row">
                <span className="req-note">campos obrigatórios</span>
                <button className="btn btn-primary" type="button" onClick={nextStep1} disabled={!step1Ready}>Continuar <ChevronRight aria-hidden="true" /></button>
              </div>
            </section>

            <section className={classNames('step-body', currentStep === 2 && 'active')}>
              <div className="fh">
                <span className="fh-eyebrow"><span className="e-ico"><User aria-hidden="true" /></span>Passo 2 de 3</span>
                <h2>Seus dados pessoais</h2>
                <p className="sub">Nome completo como aparece no seu documento de identidade.</p>
              </div>

              <div className="stack">
                <div className="f">
                  <label htmlFor="nome">Nome completo <span className="req">*</span></label>
                  <div className="iw"><User className="il" aria-hidden="true" /><input id="nome" type="text" placeholder="Como aparece no documento" autoComplete="name" value={formData.fullName} onChange={(event) => updateField('fullName', event.target.value)} /></div>
                  <FieldError>{errors.fullName}</FieldError>
                </div>

                <div className="note gold"><Shield aria-hidden="true" /><span>Seu nome será usado apenas para identificação na plataforma e nunca compartilhado com terceiros sem sua autorização.</span></div>
              </div>

              <div className="btn-row">
                <button className="btn btn-ghost" type="button" onClick={() => goToStep(1)}><ChevronLeft aria-hidden="true" /> Voltar</button>
                <button className="btn btn-primary" type="button" onClick={nextStep2} disabled={!step2Ready}>Continuar <ChevronRight aria-hidden="true" /></button>
              </div>
            </section>

            <section className={classNames('step-body', currentStep === 3 && 'active')}>
              <div className="fh">
                <span className="fh-eyebrow"><span className="e-ico"><Check aria-hidden="true" /></span>Passo 3 de 3</span>
                <h2>Confirme seus dados</h2>
                <p className="sub">Revise as informações antes de criar sua conta. Você poderá editar tudo no seu perfil depois.</p>
              </div>

              <div className="review">
                <ReviewItem icon={<Mail />} title="E-mail" value={formData.email} onEdit={() => goToStep(1)} />
                <ReviewItem icon={<Phone />} title="Telefone" value={formData.phone} onEdit={() => goToStep(1)} />
                <ReviewItem icon={<User />} title="Nome completo" value={formData.fullName} onEdit={() => goToStep(2)} />
              </div>

              {errors.general ? <div className="error-box"><Info aria-hidden="true" /> {errors.general}</div> : null}

              <div className="btn-row">
                <button className="btn btn-ghost" type="button" onClick={() => goToStep(2)} disabled={isSubmitting}><ChevronLeft aria-hidden="true" /> Editar dados</button>
                <button className="btn btn-gold" type="button" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? <><span className="spinner" /> Criando conta...</> : <>Criar conta <ChevronRight aria-hidden="true" /></>}</button>
              </div>
            </section>

            <div className="alt-login">Está com problemas? <a href="/">Fale com a gente</a></div>
          </div>
        </main>
      </div>

      <footer>
        <span>© Propya · A revolução imobiliária começou.</span>
        <div className="fsoc"><a href="#">TikTok</a><a href="#">Instagram</a><a href="#">LinkedIn</a><a href="#">YouTube</a></div>
      </footer>
    </div>
  );
}
