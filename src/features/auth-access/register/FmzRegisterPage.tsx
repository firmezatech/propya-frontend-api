'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
  Lock,
  Mail,
  Phone,
  Shield,
  User,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '../../../i18n/navigation';
import { FmzAuthHeader, FmzPublicFooter } from '../../../components/layout';
import { FmzCountryPhoneSelect } from '../../../components/design-system';
import { resolveFmzCountryPhone, type FmzCountryPhone } from '../../../lib/fmz-country-phone-data';
import { formatFmzPhoneNationalNumber, getFmzPhoneCountry, type FmzPhoneCountryCode } from '../../../lib/fmz-phone-country-format';
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
.firmeza-register-shell{--lime:#C8ED5E;--lime-2:#BCE54A;--lime-soft:#E7F7B8;--lime-tint:#F3FADD;--plum:#2A1A22;--plum-2:#3D2A33;--gold:var(--lime);--gold-soft:var(--lime-2);--gold-tint:var(--lime-tint);--gold-deep:var(--plum);--navy:var(--plum);--navy-2:var(--plum-2);--ink:#2A1A22;--muted:#6F6168;--hint:#9B9097;--line:#EAE7E5;--page:#F6F5F2;--cream:#FBFAF6;--cream-2:#F1EEE8;--white:#FFFFFF;--green:#3E8E5A;--green-tint:#E8F2EB;--red:#B23B2D;--red-tint:#FBEDEB;--blue:#1F5BD6;--blue-tint:#E8EFFC;font-family:'Inter',system-ui,sans-serif;background:var(--page);color:var(--ink);font-size:15px;line-height:1.5;min-height:100vh;overflow-x:hidden;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}.firmeza-register-shell button,.firmeza-register-shell a,.firmeza-register-shell input{font-family:inherit;color:inherit}.firmeza-register-shell a{text-decoration:none}.firmeza-register-shell .mono{font-family:var(--font-inter),Inter,system-ui,sans-serif;font-feature-settings:'tnum'}
.firmeza-register-shell .nav{height:68px;padding:0 clamp(20px,4vw,40px);display:flex;align-items:center;justify-content:space-between;gap:18px;background:rgba(255,255,255,.92);backdrop-filter:saturate(140%) blur(10px);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:100}.firmeza-register-shell .nav-l{display:flex;align-items:center;gap:14px;min-width:0}.firmeza-register-shell .logo{display:flex;align-items:center;gap:11px;min-width:0}.firmeza-register-shell .logo-mark{width:38px;height:38px;border-radius:10px;background:var(--gold);display:grid;place-items:center;flex-shrink:0;box-shadow:0 6px 14px rgba(200,237,94,.32),inset 0 -2px 0 rgba(42,26,34,.06)}.firmeza-register-shell .logo-mark svg{width:20px;height:20px}.firmeza-register-shell .logo-text{font-weight:700;font-size:16.5px;color:var(--navy);letter-spacing:-.02em;white-space:nowrap}.firmeza-register-shell .logo-divider{width:1px;height:22px;background:var(--line);margin:0 4px;flex-shrink:0}.firmeza-register-shell .logo-context{font-size:12.5px;color:var(--muted);font-weight:500;white-space:nowrap;display:flex;align-items:center;gap:7px}.firmeza-register-shell .logo-context::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--gold);box-shadow:0 0 0 3px rgba(200,237,94,.22)}.firmeza-register-shell .logo-context strong{color:var(--navy);font-weight:600}.firmeza-register-shell .nav-r{display:flex;align-items:center;gap:14px;font-size:13px;color:var(--muted)}.firmeza-register-shell .nv-link{font-size:13px;color:var(--navy);font-weight:600;display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;border:1.5px solid var(--line);background:var(--white);transition:border-color .15s,transform .15s,box-shadow .15s}.firmeza-register-shell .nv-link:hover{border-color:var(--navy);transform:translateY(-1px);box-shadow:0 6px 18px rgba(42,26,34,.08)}.firmeza-register-shell .nv-link svg{width:13px;height:13px;color:var(--gold-deep)}
.firmeza-register-shell .shell{display:grid;grid-template-columns:minmax(360px,1fr) minmax(420px,1fr);min-height:calc(100vh - 68px);align-items:stretch;width:100%;max-width:none;margin:0;background:var(--white)}.firmeza-register-shell .side{position:relative;overflow:hidden;background:linear-gradient(180deg,var(--cream) 0%,var(--cream-2) 100%);padding:clamp(40px,5vw,72px) clamp(40px,5vw,88px) clamp(32px,4vw,48px) clamp(24px,3vw,56px);display:flex;flex-direction:column;align-items:flex-end;justify-content:center;min-height:calc(100vh - 68px);border-right:1px solid var(--line)}.firmeza-register-shell .side>div{width:min(100%,480px);margin-left:auto}.firmeza-register-shell .side::before{content:'';position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(to right,rgba(42,26,34,.04) 1px,transparent 1px),linear-gradient(to bottom,rgba(42,26,34,.04) 1px,transparent 1px);background-size:42px 42px;mask-image:radial-gradient(circle at 30% 40%,black 0%,transparent 80%)}.firmeza-register-shell .side::after{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(60% 50% at 110% -10%,rgba(200,237,94,.22) 0%,transparent 60%),radial-gradient(50% 50% at -10% 110%,rgba(200,237,94,.10) 0%,transparent 60%)}.firmeza-register-shell .side>*{position:relative;z-index:1}.firmeza-register-shell .eyebrow-dark{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--gold-deep);margin-bottom:28px}.firmeza-register-shell .eyebrow-dark::before{content:'';width:18px;height:1.5px;background:var(--gold);border-radius:1px}.firmeza-register-shell .side h1{font-weight:800;font-size:clamp(30px,3.4vw,44px);line-height:1.05;letter-spacing:-.035em;color:var(--navy);margin-bottom:20px;max-width:480px}.firmeza-register-shell .side h1 em{font-style:normal;color:var(--navy);background:linear-gradient(transparent 60%,var(--gold) 60%,var(--gold) 94%,transparent 94%);padding:0 2px;border-radius:2px}.firmeza-register-shell .lede{font-size:14.5px;line-height:1.6;color:var(--muted);max-width:420px;margin-bottom:36px}.firmeza-register-shell .form-col{background:var(--white);display:flex;flex-direction:column;align-items:flex-start;justify-content:center;padding:clamp(40px,5vw,72px) clamp(24px,4vw,56px) clamp(40px,5vw,72px) clamp(40px,5vw,88px);position:relative;min-height:calc(100vh - 68px)}.firmeza-register-shell .form-inner{width:min(100%,440px);max-width:440px;margin:0;display:flex;flex-direction:column}.firmeza-register-shell .stepper{display:flex;align-items:center;gap:0;margin-bottom:36px;padding:6px;background:var(--page);border:1px solid var(--line);border-radius:14px}.firmeza-register-shell .step{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:8px 10px;border-radius:10px;font-size:12px;font-weight:600;color:var(--hint);white-space:nowrap}.firmeza-register-shell .step-n{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;flex-shrink:0;font-size:10.5px;font-weight:700;background:var(--white);border:1.5px solid var(--line);color:var(--hint)}.firmeza-register-shell .step.done{color:var(--green)}.firmeza-register-shell .step.done .step-n{background:var(--green);border-color:var(--green);color:var(--white)}.firmeza-register-shell .step.active{background:var(--white);color:var(--navy);box-shadow:0 1px 2px rgba(42,26,34,.04)}.firmeza-register-shell .step.active .step-n{background:var(--navy);border-color:var(--navy);color:var(--gold)}.firmeza-register-shell .fh{margin-bottom:28px}.firmeza-register-shell .fh-eyebrow{display:inline-flex;align-items:center;gap:7px;font-size:10.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--gold-deep);margin-bottom:12px}.firmeza-register-shell .e-ico{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:5px;background:var(--gold-tint);color:var(--gold-deep)}.firmeza-register-shell .e-ico svg{width:10px;height:10px}.firmeza-register-shell .fh h2{font-weight:700;font-size:clamp(24px,3vw,30px);letter-spacing:-.035em;line-height:1.1;color:var(--navy);margin-bottom:6px}.firmeza-register-shell .sub{font-size:13.5px;color:var(--muted);line-height:1.55;max-width:380px}.firmeza-register-shell .step-body{display:none;animation:fadeUp .3s ease}.firmeza-register-shell .step-body.active{display:block}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.firmeza-register-shell .stack{display:flex;flex-direction:column;gap:14px}.firmeza-register-shell .f{display:flex;flex-direction:column;gap:6px}.firmeza-register-shell label{font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:4px}.firmeza-register-shell label .req{color:var(--red);margin-left:2px}.firmeza-register-shell .iw{position:relative}.firmeza-register-shell .iw .il{position:absolute;left:12px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--hint);pointer-events:none;transition:color .2s}.firmeza-register-shell .iw .ir{position:absolute;right:10px;top:50%;transform:translateY(-50%);width:28px;height:28px;color:var(--hint);cursor:pointer;background:none;border:none;padding:0;border-radius:7px;display:grid;place-items:center}.firmeza-register-shell .iw .ir svg{width:14px;height:14px}.firmeza-register-shell input[type=text],.firmeza-register-shell input[type=email],.firmeza-register-shell input[type=tel]{width:100%;border:1.5px solid var(--line);border-radius:11px;padding:13px 14px;font-size:14.5px;color:var(--navy);background:var(--white);transition:all .15s;outline:none}.firmeza-register-shell .iw input{padding-left:38px}.firmeza-register-shell .phone-row{display:grid;grid-template-columns:148px 1fr;gap:8px}.firmeza-register-shell .phone-row input[type=tel]{width:100%}.firmeza-register-shell .iw.hr{overflow:hidden;border:1.5px solid var(--line);border-radius:11px;background:var(--white);transition:all .15s}.firmeza-register-shell .iw.hr input[type=password],.firmeza-register-shell .iw.hr input[type=text]{width:100%;border:0;border-radius:0;padding:13px 42px 13px 38px;font-size:14.5px;color:var(--navy);background:transparent;outline:none}.firmeza-register-shell input[type=password]::-ms-reveal,.firmeza-register-shell input[type=password]::-ms-clear{display:none}.firmeza-register-shell input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(200,237,94,.20)}.firmeza-register-shell .iw.hr:focus-within{border-color:var(--gold);box-shadow:0 0 0 3px rgba(200,237,94,.20)}.firmeza-register-shell input.valid{border-color:var(--green);box-shadow:0 0 0 3px rgba(18,122,79,.12)}.firmeza-register-shell input.invalid{border-color:var(--red);box-shadow:0 0 0 3px rgba(178,59,45,.12)}.firmeza-register-shell .iw.hr.valid{border-color:var(--green);box-shadow:0 0 0 3px rgba(18,122,79,.12)}.firmeza-register-shell .iw.hr.invalid{border-color:var(--red);box-shadow:0 0 0 3px rgba(178,59,45,.12)}.firmeza-register-shell input::placeholder{color:var(--hint)}.firmeza-register-shell .hint{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:var(--muted);min-height:16px;line-height:1.3}.firmeza-register-shell .hint svg{width:11px;height:11px;flex-shrink:0}.firmeza-register-shell .hint.ok{color:var(--green)}.firmeza-register-shell .hint.err{color:var(--red)}.firmeza-register-shell .pbars{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:6px}.firmeza-register-shell .pbar{height:3px;border-radius:999px;background:var(--line);transition:background .25s}.firmeza-register-shell .pbar-hint{font-size:11.5px;color:var(--muted);margin-top:6px;min-height:16px;display:inline-flex;align-items:center;gap:5px}.firmeza-register-shell .note{display:flex;align-items:flex-start;gap:9px;padding:11px 13px;background:var(--blue-tint);border:1px solid rgba(31,91,214,.15);border-radius:10px;font-size:12.5px;color:var(--blue);line-height:1.45}.firmeza-register-shell .note.gold{background:var(--gold-tint);border-color:rgba(200,237,94,.30);color:var(--gold-deep)}.firmeza-register-shell .note svg{width:14px;height:14px;flex-shrink:0;margin-top:1px}.firmeza-register-shell .terms-row{display:flex;align-items:flex-start;gap:11px;padding:14px 16px;background:var(--page);border:1px solid var(--line);border-radius:11px;cursor:pointer;transition:border-color .15s,background .15s;text-transform:none;letter-spacing:0}.firmeza-register-shell .terms-row input[type=checkbox]{width:17px;height:17px;flex-shrink:0;margin-top:1px;accent-color:var(--navy);cursor:pointer}.firmeza-register-shell .terms-row span{font-size:12.5px;color:var(--muted);line-height:1.5;font-weight:400}.firmeza-register-shell .terms-row span a{color:var(--navy);font-weight:600;border-bottom:1px solid var(--line)}.firmeza-register-shell .review{display:flex;flex-direction:column;gap:8px;margin-bottom:6px}.firmeza-register-shell .rv{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid var(--line);border-radius:11px;background:var(--white)}.firmeza-register-shell .rv-ico{width:32px;height:32px;border-radius:9px;background:var(--page);color:var(--navy);display:grid;place-items:center;flex-shrink:0}.firmeza-register-shell .rv-ico svg{width:14px;height:14px}.firmeza-register-shell .rv-body{flex:1;min-width:0}.firmeza-register-shell .rv-k{font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:2px}.firmeza-register-shell .rv-v{font-size:13.5px;color:var(--navy);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.firmeza-register-shell .rv-edit{font-size:11.5px;font-weight:600;color:var(--gold-deep);cursor:pointer;background:none;border:none;padding:6px 10px;border-radius:7px}.firmeza-register-shell .btn-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:28px;flex-wrap:wrap}.firmeza-register-shell .req-note{font-size:11.5px;color:var(--hint);display:inline-flex;align-items:center;gap:4px}.firmeza-register-shell .req-note::before{content:'*';color:var(--red);font-weight:700}.firmeza-register-shell .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 22px;border-radius:11px;font-size:13.5px;font-weight:600;cursor:pointer;border:1.5px solid transparent;transition:all .15s;white-space:nowrap}.firmeza-register-shell .btn svg{width:14px;height:14px}.firmeza-register-shell .btn:active{transform:scale(.98)}.firmeza-register-shell .btn-ghost{background:var(--white);border-color:var(--line);color:var(--navy)}.firmeza-register-shell .btn-ghost:hover{background:#FAFBFC;border-color:#D0D4DE}.firmeza-register-shell .btn-primary{background:var(--navy);color:var(--white);border-color:var(--navy)}.firmeza-register-shell .btn-primary:hover{background:var(--navy-2);border-color:var(--navy-2);transform:translateY(-1px);box-shadow:0 8px 22px rgba(42,26,34,.22)}.firmeza-register-shell .btn-primary:disabled,.firmeza-register-shell .btn-gold:disabled{opacity:.45;cursor:not-allowed;transform:none;box-shadow:none}.firmeza-register-shell .btn-gold{background:var(--gold);color:var(--navy);border-color:var(--gold)}.firmeza-register-shell .btn-gold:hover{background:var(--gold-soft);border-color:var(--gold-soft);transform:translateY(-1px);box-shadow:0 8px 22px rgba(200,237,94,.40)}.firmeza-register-shell .btn-full{width:100%}.firmeza-register-shell .alt-login{margin-top:22px;padding-top:22px;border-top:1px dashed var(--line);text-align:center;font-size:12.5px;color:var(--muted)}.firmeza-register-shell .alt-login a{color:var(--navy);font-weight:600;border-bottom:1px solid var(--line)}.firmeza-register-shell .success-wrap{text-align:center;padding:8px 0}.firmeza-register-shell .s-ico{width:84px;height:84px;border-radius:50%;background:var(--green-tint);color:var(--green);display:grid;place-items:center;margin:0 auto 22px;position:relative}.firmeza-register-shell .s-ico svg{width:34px;height:34px}.firmeza-register-shell .s-title{font-weight:700;font-size:26px;color:var(--navy);letter-spacing:-.035em;margin-bottom:8px}.firmeza-register-shell .s-sub{font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:28px}.firmeza-register-shell .s-sub strong{color:var(--navy);font-weight:600}.firmeza-register-shell .s-items{display:flex;flex-direction:column;gap:10px;text-align:left;margin-bottom:28px}.firmeza-register-shell .error-box{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:11px;background:var(--red-tint);color:var(--red);font-size:12.5px;line-height:1.45;border:1px solid rgba(178,59,45,.18);margin-top:14px}.firmeza-register-shell .spinner{width:14px;height:14px;border:2px solid rgba(42,26,34,.25);border-top-color:var(--navy);border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.firmeza-register-shell footer{border-top:1px solid var(--line);background:var(--white);padding:0;display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:12px;color:var(--hint)}.firmeza-register-shell .fsoc{display:flex;gap:18px}.firmeza-register-shell .fsoc a{color:var(--hint);transition:color .15s}.firmeza-register-shell .fsoc a:hover{color:var(--navy)}
@media (max-width:1100px){.firmeza-register-shell .shell{grid-template-columns:1fr;max-width:none}.firmeza-register-shell .side{align-items:stretch;min-height:auto;padding:48px clamp(20px,5vw,40px) 56px}.firmeza-register-shell .side>div{width:100%;margin-left:0}.firmeza-register-shell .form-col{align-items:center;min-height:auto;padding:44px 20px 56px}.firmeza-register-shell .form-inner{margin:0 auto}}@media (max-width:880px){.firmeza-register-shell .logo-divider,.firmeza-register-shell .logo-context{display:none}}@media (max-width:560px){.firmeza-register-shell .form-col{padding:32px 16px 44px}.firmeza-register-shell .fh{margin-bottom:24px}.firmeza-register-shell .stepper{padding:4px}.firmeza-register-shell .step{padding:7px 6px;font-size:11px}.firmeza-register-shell .step-label-txt{display:none}.firmeza-register-shell .btn-row{flex-direction:column-reverse}.firmeza-register-shell .btn-row .btn{width:100%}.firmeza-register-shell .req-note{align-self:flex-start}.firmeza-register-shell footer{flex-direction:column;align-items:flex-start}}@media (prefers-reduced-motion:reduce){.firmeza-register-shell *{animation:none!important;transition:none!important}}
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

// Only the countries the formatting lib knows (BR/US/PT) get a national mask;
// everything else just keeps the raw digits.
const hasNationalMask = (iso2: string): iso2 is FmzPhoneCountryCode => getFmzPhoneCountry(iso2).code === iso2;

function formatPhoneForCountry(value: string, iso2: string): string {
  return hasNationalMask(iso2) ? formatFmzPhoneNationalNumber(value, iso2) : value.replace(/\D/g, '').slice(0, 15);
}

function phoneInputPlaceholder(country: FmzCountryPhone): string {
  return hasNationalMask(country.iso2) ? getFmzPhoneCountry(country.iso2).placeholder : 'Número de telefone';
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

  const activePhoneCountry = useMemo(() => resolveFmzCountryPhone(formData.phoneCountry), [formData.phoneCountry]);

  const updatePhone = (nationalNumber: string, country: FmzCountryPhone) => {
    setFormData((current) => ({ ...current, phone: formatPhoneForCountry(nationalNumber, country.iso2), phoneCountry: country.iso2 }));
    setErrors((current) => ({ ...current, phone: undefined, general: undefined }));
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
  const passwordColors = ['', '#B23B2D', '#C8ED5E', '#2A1A22', '#3E8E5A'];

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
          </div>
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
                <p className="sub">E-mail e senha. Leva menos de 1 minuto.</p>
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
                  <div className={classNames('iw hr', formData.passwordConfirmation && passwordsMatch && 'valid', formData.passwordConfirmation && !passwordsMatch && 'invalid')}>
                    <Lock className="il" aria-hidden="true" />
                    <input id="senha2" type={showPasswordConfirmation ? 'text' : 'password'} placeholder="Repita a senha" autoComplete="new-password" value={formData.passwordConfirmation} onChange={(event) => updateField('passwordConfirmation', event.target.value)} />
                    <button className="ir" type="button" onClick={() => setShowPasswordConfirmation((value) => !value)} aria-label={showPasswordConfirmation ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}>{showPasswordConfirmation ? <EyeOff /> : <Eye />}</button>
                  </div>
                  {formData.passwordConfirmation && passwordsMatch ? <span className="hint ok"><Check aria-hidden="true" /> Senhas conferem</span> : <FieldError>{errors.passwordConfirmation}</FieldError>}
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
                <p className="sub">Nome completo como aparece no seu documento de identidade e um telefone para contato.</p>
              </div>

              <div className="stack">
                <div className="f">
                  <label htmlFor="nome">Nome completo <span className="req">*</span></label>
                  <div className="iw"><User className="il" aria-hidden="true" /><input id="nome" type="text" placeholder="Como aparece no documento" autoComplete="name" value={formData.fullName} onChange={(event) => updateField('fullName', event.target.value)} /></div>
                  <FieldError>{errors.fullName}</FieldError>
                </div>

                <div className="f">
                  <label htmlFor="phone">Telefone <span className="req">*</span></label>
                  <div className="phone-row">
                    <FmzCountryPhoneSelect value={activePhoneCountry.iso2} onChange={(country) => updatePhone(formData.phone, country)} ariaLabel="Código do país" />
                    <input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder={phoneInputPlaceholder(activePhoneCountry)}
                      value={formData.phone}
                      onChange={(event) => updatePhone(event.target.value, activePhoneCountry)}
                    />
                  </div>
                  <span className="hint"><Info aria-hidden="true" /> Usado apenas para verificação em duas etapas</span>
                  <FieldError>{errors.phone}</FieldError>
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
                <ReviewItem icon={<User />} title="Nome completo" value={formData.fullName} onEdit={() => goToStep(2)} />
                <ReviewItem icon={<Phone />} title="Telefone" value={formData.phone ? `${activePhoneCountry.dialCode} ${formData.phone}` : ''} onEdit={() => goToStep(2)} />
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

      <FmzPublicFooter />
    </div>
  );
}
