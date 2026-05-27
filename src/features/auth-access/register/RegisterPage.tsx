'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Eye,
  Lock,
  Mail,
  Phone,
  Shield,
  TrendingUp,
  User,
} from 'lucide-react';
import { useRouter } from '../../../i18n/navigation';
import { registerUser } from './register-api';
import {
  computePasswordStrength,
  hasErrors,
  maskBirthdate,
  maskCpf,
  validateCpf,
  validateStep1,
  validateStep2,
} from './register.validation';
import type { RegisterAllErrors, RegisterFormData } from './register.types';

const INITIAL_FORM_DATA: RegisterFormData = {
  accountType: 'investor',
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

const MailIcon = () => <Mail className="il" aria-hidden="true" />;
const LockIcon = () => <Lock className="il" aria-hidden="true" />;
const PhoneIcon = () => <Phone className="il" aria-hidden="true" />;
const UserIcon = () => <User className="il" aria-hidden="true" />;
const CalendarIcon = () => <Calendar className="il" aria-hidden="true" />;
const CpfIcon = () => <CreditCard className="il" aria-hidden="true" />;

function RegisterStyles() {
  return (
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
.firmeza-register-shell *, .firmeza-register-shell *::before, .firmeza-register-shell *::after{box-sizing:border-box;margin:0;padding:0}
.firmeza-register-shell{--gold:#E8B620;--gold-soft:#F5D26B;--gold-tint:#FBF3DA;--gold-deep:#8A6B12;--navy:#0E1626;--navy-2:#1C2740;--ink:#2A344A;--muted:#5A6478;--hint:#8893A6;--line:#E6E8EE;--line-2:#EDEFF4;--page:#F4F5F8;--white:#FFFFFF;--green:#127A4F;--green-tint:#E8F5EE;--red:#B23B2D;--red-tint:#FBEDEB;--blue:#1F5BD6;--blue-tint:#E8EFFC;--shadow-sm:0 1px 2px rgba(14,22,38,.04),0 1px 0 rgba(14,22,38,.02);--shadow-md:0 2px 6px rgba(14,22,38,.05),0 8px 24px -8px rgba(14,22,38,.08);--shadow-lg:0 4px 12px rgba(14,22,38,.06),0 20px 48px -12px rgba(14,22,38,.14);--radius:14px;--radius-lg:20px;font-family:'DM Sans',system-ui,sans-serif;background:var(--page);color:var(--ink);font-size:15px;line-height:1.5;min-height:100vh;overflow-x:hidden;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.firmeza-register-shell button,.firmeza-register-shell a,.firmeza-register-shell input{font-family:inherit;color:inherit}.firmeza-register-shell a{text-decoration:none}.firmeza-register-shell .mono{font-family:'JetBrains Mono',monospace;font-feature-settings:'tnum'}
.firmeza-register-shell nav{display:flex;align-items:center;justify-content:space-between;padding:0 clamp(20px,4vw,40px);height:60px;background:var(--white);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:100}.firmeza-register-shell .logo{display:flex;align-items:center;gap:10px}.firmeza-register-shell .logo-mark{width:30px;height:30px;border-radius:8px;background:var(--navy);display:grid;place-items:center}.firmeza-register-shell .logo-text{font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:var(--navy);letter-spacing:-.01em}.firmeza-register-shell .nav-r{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--muted)}.firmeza-register-shell .nav-r button{color:var(--navy);font-weight:600;transition:color .15s;background:transparent;border:0;cursor:pointer}.firmeza-register-shell .nav-r button:hover{color:var(--gold-deep)}
.firmeza-register-shell .root{display:grid;grid-template-columns:1fr minmax(0,480px) 1fr;min-height:calc(100vh - 60px);align-items:start}.firmeza-register-shell .side-panel{background:var(--navy);min-height:calc(100vh - 60px);padding:clamp(40px,5vw,64px) clamp(28px,3vw,48px);position:sticky;top:60px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden}.firmeza-register-shell .side-panel::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 110% -10%,rgba(232,182,32,.25) 0%,transparent 50%),radial-gradient(ellipse at -10% 110%,rgba(232,182,32,.12) 0%,transparent 50%);pointer-events:none}.firmeza-register-shell .side-panel>*{position:relative;z-index:1}.firmeza-register-shell .side-geo{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0}.firmeza-register-shell .side-geo svg{position:absolute;bottom:-60px;right:-60px;opacity:.06}.firmeza-register-shell .sp-tag{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);display:inline-flex;align-items:center;gap:8px;margin-bottom:40px}.firmeza-register-shell .sp-tag::before{content:'';width:16px;height:1.5px;background:var(--gold);border-radius:1px}.firmeza-register-shell .sp-headline{font-family:'Syne',sans-serif;font-weight:800;font-size:clamp(26px,2.8vw,38px);line-height:1.08;letter-spacing:-.03em;color:var(--white);margin-bottom:20px}.firmeza-register-shell .sp-headline em{color:var(--gold);font-style:normal}.firmeza-register-shell .sp-sub{font-size:14px;color:rgba(255,255,255,.55);line-height:1.65;max-width:340px;margin-bottom:40px}.firmeza-register-shell .sp-features{display:flex;flex-direction:column;gap:14px}.firmeza-register-shell .spf{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);transition:background .2s}.firmeza-register-shell .spf:hover{background:rgba(255,255,255,.08)}.firmeza-register-shell .spf-ico{width:34px;height:34px;border-radius:9px;background:rgba(232,182,32,.15);color:var(--gold);display:grid;place-items:center;flex-shrink:0}.firmeza-register-shell .spf-ico svg{width:15px;height:15px}.firmeza-register-shell .spf-body h4{font-size:13px;font-weight:600;color:var(--white);letter-spacing:-.005em;margin-bottom:1px}.firmeza-register-shell .spf-body p{font-size:11.5px;color:rgba(255,255,255,.45);line-height:1.4}.firmeza-register-shell .sp-foot{margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,.1)}.firmeza-register-shell .trust-row{display:flex;align-items:center;gap:10px}.firmeza-register-shell .trust-ico{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.08);color:rgba(255,255,255,.5);display:grid;place-items:center;font-family:'Syne',sans-serif;font-weight:700;font-size:10px;letter-spacing:.04em}.firmeza-register-shell .trust-ico.gold{background:rgba(232,182,32,.2);color:var(--gold-soft)}.firmeza-register-shell .trust-ico:nth-child(n+2){margin-left:-10px}.firmeza-register-shell .trust-txt{font-size:12px;color:rgba(255,255,255,.45);margin-left:6px}.firmeza-register-shell .trust-txt strong{color:rgba(255,255,255,.75)}
.firmeza-register-shell .form-col{padding:clamp(32px,4vw,56px) clamp(20px,3vw,36px);display:flex;flex-direction:column;gap:0}.firmeza-register-shell .stepper{display:flex;align-items:center;gap:0;margin-bottom:36px}.firmeza-register-shell .step{display:flex;align-items:center;gap:8px;flex:1}.firmeza-register-shell .step:last-child{flex:0}.firmeza-register-shell .step-circle{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;flex-shrink:0;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;border:2px solid var(--line);color:var(--hint);background:var(--white);transition:all .3s}.firmeza-register-shell .step.done .step-circle{background:var(--green);border-color:var(--green);color:var(--white)}.firmeza-register-shell .step.active .step-circle{background:var(--navy);border-color:var(--navy);color:var(--white)}.firmeza-register-shell .step-label{font-size:11px;font-weight:600;color:var(--hint);white-space:nowrap;letter-spacing:.02em;transition:color .3s}.firmeza-register-shell .step.active .step-label{color:var(--navy)}.firmeza-register-shell .step.done .step-label{color:var(--green)}.firmeza-register-shell .step-line{flex:1;height:1.5px;background:var(--line);margin:0 8px;border-radius:1px;position:relative;overflow:hidden}.firmeza-register-shell .step-line-fill{position:absolute;top:0;left:0;height:100%;width:0%;background:var(--green);transition:width .5s cubic-bezier(.4,0,.2,1);border-radius:1px}.firmeza-register-shell .fh{margin-bottom:28px}.firmeza-register-shell .fh-sup{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--gold-deep);display:inline-flex;align-items:center;gap:8px;margin-bottom:8px}.firmeza-register-shell .fh-sup::before{content:'';width:14px;height:1.5px;background:var(--gold);border-radius:1px}.firmeza-register-shell .fh-title{font-family:'Syne',sans-serif;font-weight:700;font-size:clamp(22px,3vw,28px);letter-spacing:-.025em;line-height:1.1;color:var(--navy);margin-bottom:6px}.firmeza-register-shell .fh-sub{font-size:13.5px;color:var(--muted);line-height:1.5}.firmeza-register-shell .step-body{display:none;animation:fadeUp .3s ease}.firmeza-register-shell .step-body.active{display:block}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.firmeza-register-shell .f{display:flex;flex-direction:column;gap:6px;margin-bottom:2px}.firmeza-register-shell label{font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:4px}.firmeza-register-shell label .req{color:var(--red);margin-left:2px}.firmeza-register-shell .iw{position:relative}.firmeza-register-shell .iw .il{position:absolute;left:12px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--hint);pointer-events:none}.firmeza-register-shell .iw .ir{position:absolute;right:12px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--hint);cursor:pointer;background:none;border:none;padding:0;transition:color .15s;display:grid;place-items:center}.firmeza-register-shell .iw .ir:hover{color:var(--navy)}.firmeza-register-shell input[type=text],.firmeza-register-shell input[type=email],.firmeza-register-shell input[type=tel],.firmeza-register-shell input[type=password]{width:100%;border:1px solid var(--line);border-radius:10px;padding:12px 14px;font-size:14px;font-family:inherit;color:var(--navy);background:var(--white);transition:all .15s;outline:none}.firmeza-register-shell .iw input{padding-left:38px}.firmeza-register-shell .iw.hr input{padding-right:40px}.firmeza-register-shell input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(232,182,32,.18)}.firmeza-register-shell input.valid{border-color:var(--green);box-shadow:0 0 0 3px rgba(18,122,79,.12)}.firmeza-register-shell input.invalid{border-color:var(--red);box-shadow:0 0 0 3px rgba(178,59,45,.1)}.firmeza-register-shell input::placeholder{color:var(--hint)}.firmeza-register-shell .hint{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;color:var(--muted);min-height:16px}.firmeza-register-shell .hint svg{width:11px;height:11px;flex-shrink:0}.firmeza-register-shell .hint.ok{color:var(--green)}.firmeza-register-shell .hint.err{color:var(--red)}.firmeza-register-shell .pbars{display:flex;gap:3px;margin-top:4px}.firmeza-register-shell .pbar{flex:1;height:3px;border-radius:999px;background:var(--line);transition:background .25s}.firmeza-register-shell .pbar-hint{font-size:11.5px;color:var(--muted);margin-top:4px;min-height:16px;transition:color .25s}.firmeza-register-shell .cpf-note{display:flex;align-items:center;gap:6px;padding:10px 12px;background:var(--blue-tint);border:1px solid rgba(31,91,214,.15);border-radius:9px;margin-top:6px;font-size:12px;color:var(--blue)}.firmeza-register-shell .cpf-note svg{width:12px;height:12px;flex-shrink:0}.firmeza-register-shell .terms-row{display:flex;align-items:flex-start;gap:10px;padding:14px 16px;background:var(--page);border:1px solid var(--line);border-radius:10px;margin-top:16px;cursor:pointer}.firmeza-register-shell .terms-row input[type=checkbox]{width:16px;height:16px;flex-shrink:0;margin-top:2px;accent-color:var(--navy);cursor:pointer;border-radius:4px}.firmeza-register-shell .terms-row span{font-size:12.5px;color:var(--muted);line-height:1.5}.firmeza-register-shell .terms-row span a{color:var(--navy);font-weight:600;border-bottom:1px solid var(--line)}.firmeza-register-shell .terms-row span a:hover{border-color:var(--navy)}
.firmeza-register-shell .s-item{display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid var(--line);border-radius:10px;background:var(--white)}.firmeza-register-shell .s-item-ico{width:30px;height:30px;border-radius:8px;background:var(--gold-tint);color:var(--gold-deep);display:grid;place-items:center;flex-shrink:0}.firmeza-register-shell .s-item-ico svg{width:13px;height:13px}.firmeza-register-shell .s-item-body{flex:1;min-width:0}.firmeza-register-shell .s-item-body strong{display:block;font-size:12.5px;color:var(--navy);font-weight:600;margin-bottom:1px}.firmeza-register-shell .s-item-body span{font-size:11.5px;color:var(--muted)}.firmeza-register-shell .success-wrap{text-align:center;padding:20px 0}.firmeza-register-shell .s-ico{width:72px;height:72px;border-radius:50%;background:var(--green-tint);color:var(--green);display:grid;place-items:center;margin:0 auto 20px;animation:popIn .4s cubic-bezier(.34,1.56,.64,1)}@keyframes popIn{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}.firmeza-register-shell .s-ico svg{width:30px;height:30px}.firmeza-register-shell .s-title{font-family:'Syne',sans-serif;font-weight:700;font-size:24px;color:var(--navy);letter-spacing:-.025em;margin-bottom:8px}.firmeza-register-shell .s-sub{font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:28px}.firmeza-register-shell .s-items{display:flex;flex-direction:column;gap:10px;text-align:left;margin-bottom:28px}.firmeza-register-shell .alert{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:10px;background:var(--red-tint);border:1px solid rgba(178,59,45,.18);color:var(--red);font-size:12px;margin-bottom:16px}.firmeza-register-shell .alert strong{display:block;color:var(--red);font-size:12.5px;margin-bottom:2px}
.firmeza-register-shell .btn-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:24px;flex-wrap:wrap}.firmeza-register-shell .btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:12px 22px;border-radius:10px;font-family:inherit;font-size:14px;font-weight:600;letter-spacing:.005em;cursor:pointer;border:1px solid transparent;transition:all .15s;white-space:nowrap}.firmeza-register-shell .btn svg{width:14px;height:14px}.firmeza-register-shell .btn:active{transform:scale(.98)}.firmeza-register-shell .btn-ghost{background:var(--white);border-color:var(--line);color:var(--navy)}.firmeza-register-shell .btn-ghost:hover{background:#FAFBFC;border-color:#D0D4DE}.firmeza-register-shell .btn-primary{background:var(--navy);color:var(--white);border-color:var(--navy)}.firmeza-register-shell .btn-primary:hover{background:var(--navy-2);border-color:var(--navy-2);transform:translateY(-1px);box-shadow:0 6px 20px rgba(14,22,38,.18)}.firmeza-register-shell .btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none;box-shadow:none}.firmeza-register-shell .btn-full{width:100%}.firmeza-register-shell .btn-gold{background:var(--gold);color:var(--navy);border-color:var(--gold)}.firmeza-register-shell .btn-gold:hover{background:var(--gold-soft);border-color:var(--gold-soft);transform:translateY(-1px);box-shadow:0 6px 20px rgba(232,182,32,.35)}
.firmeza-register-shell footer{border-top:1px solid var(--line);background:var(--white);padding:16px clamp(20px,4vw,40px);display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:12px;color:var(--hint)}.firmeza-register-shell .fsoc{display:flex;gap:18px}.firmeza-register-shell .fsoc a{color:var(--hint);transition:color .15s}.firmeza-register-shell .fsoc a:hover{color:var(--navy)}
.firmeza-register-shell .right-pad{display:block}.firmeza-register-shell .field-stack{display:flex;flex-direction:column;gap:16px}.firmeza-register-shell .error-text{font-size:11.5px;color:var(--red);display:flex;align-items:center;gap:5px}.firmeza-register-shell .error-text svg{width:11px;height:11px}.firmeza-register-shell .spinner{width:14px;height:14px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:1100px){.firmeza-register-shell .root{grid-template-columns:1fr minmax(0,520px)}.firmeza-register-shell .right-pad{display:none}}@media(max-width:780px){.firmeza-register-shell .root{grid-template-columns:1fr}.firmeza-register-shell .side-panel{display:none}.firmeza-register-shell .form-col{padding:28px 20px 48px}}@media(max-width:520px){.firmeza-register-shell .stepper .step-label{display:none}.firmeza-register-shell .btn-row{flex-direction:column-reverse}.firmeza-register-shell .btn-row .btn{width:100%;justify-content:center}.firmeza-register-shell footer{flex-direction:column;align-items:flex-start}}@media(prefers-reduced-motion:reduce){.firmeza-register-shell *{animation:none!important;transition:none!important}}
`}</style>
  );
}

function Logo() {
  return (
    <div className="logo">
      <div className="logo-mark">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3L3 8.5V15.5L12 21L21 15.5V8.5L12 3Z" stroke="#E8B620" strokeWidth="2" strokeLinejoin="round" />
          <path d="M12 3V21M3 8.5L21 15.5M21 8.5L3 15.5" stroke="#E8B620" strokeWidth="1" strokeOpacity=".35" />
        </svg>
      </div>
      <span className="logo-text">FirmezaToken</span>
    </div>
  );
}

function SidePanel() {
  return (
    <aside className="side-panel">
      <div className="side-geo">
        <svg width="500" height="500" viewBox="0 0 500 500" fill="none" aria-hidden="true">
          <path d="M250 50L450 175V325L250 450L50 325V175L250 50Z" stroke="white" strokeWidth="1" />
          <path d="M250 50L250 450M50 175L450 325M450 175L50 325" stroke="white" strokeWidth=".5" />
          <path d="M250 150L350 212.5V337.5L250 400L150 337.5V212.5L250 150Z" stroke="white" strokeWidth="1" />
        </svg>
      </div>
      <div>
        <div className="sp-tag">Plataforma de Tokenização</div>
        <h1 className="sp-headline">Invista em<br />imóveis com<br /><em>inteligência</em></h1>
        <p className="sp-sub">A FirmezaToken democratiza o acesso ao mercado imobiliário por meio de tokens digitais seguros, transparentes e acessíveis a partir de R$ 100.</p>
        <div className="sp-features">
          <Feature icon={<Shield />} title="Segurança blockchain" text="Ativos registrados em blockchain pública e auditável" />
          <Feature icon={<DollarSign />} title="Renda passiva real" text="Receba aluguéis proporcionais à sua participação" />
          <Feature icon={<TrendingUp />} title="Liquidez facilitada" text="Negocie seus tokens a qualquer hora no marketplace" />
        </div>
      </div>
      <div className="sp-foot">
        <div className="trust-row">
          <div className="trust-ico gold">MA</div>
          <div className="trust-ico">RB</div>
          <div className="trust-ico">CL</div>
          <div className="trust-ico">+</div>
          <span className="trust-txt"><strong>+4.800 investidores</strong> já na plataforma</span>
        </div>
      </div>
    </aside>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="spf">
      <div className="spf-ico">{icon}</div>
      <div className="spf-body">
        <h4>{title}</h4>
        <p>{text}</p>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="stepper" aria-label="Etapas do cadastro">
      {[['Acesso', 1], ['Identidade', 2], ['Confirmação', 3]].map(([label, n], index) => {
        const num = Number(n);
        const done = num < step || step === 4;
        const active = num === step;
        return (
          <div key={label} style={{ display: 'contents' }}>
            <div className={`step ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
              <div className="step-circle">{done ? <Check size={12} strokeWidth={3} /> : num}</div>
              <span className="step-label">{label}</span>
            </div>
            {index < 2 && <div className="step-line"><div className="step-line-fill" style={{ width: done ? '100%' : '0%' }} /></div>}
          </div>
        );
      })}
    </div>
  );
}

function PasswordBars({ password }: { password: string }) {
  const score = computePasswordStrength(password);
  const colors = ['', '#B23B2D', '#E8B620', '#8A6B12', '#127A4F'];
  const labels = ['Use letras maiúsculas, números e símbolos', 'Senha fraca — adicione complexidade', 'Razoável — pode melhorar', 'Boa senha', 'Senha forte ✓'];
  return (
    <>
      <div className="pbars" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => <div key={n} className="pbar" style={{ background: score >= n ? colors[score] : undefined }} />)}
      </div>
      <div className="pbar-hint" style={{ color: score > 0 ? colors[score] : undefined }}>{password ? labels[score] : labels[0]}</div>
    </>
  );
}

function ErrorText({ children }: { children?: string }) {
  if (!children) return null;
  return <span className="error-text"><AlertTriangle />{children}</span>;
}

export function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RegisterFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<RegisterAllErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [successEmail, setSuccessEmail] = useState('você');

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
  const passwordScore = computePasswordStrength(formData.password);
  const passwordOk = passwordScore >= 3;
  const matchOk = Boolean(formData.passwordConfirmation) && formData.password === formData.passwordConfirmation;
  const phoneOk = formData.phone.replace(/\D/g, '').length >= 10;
  const step1Ready = emailOk && passwordOk && matchOk && phoneOk && formData.acceptedTerms;
  const step2Ready = formData.fullName.trim().split(/\s+/).length >= 2 && formData.birthdate.length === 10 && validateCpf(formData.cpf);

  const inputClass = (valid: boolean, invalid: boolean) => valid ? 'valid' : invalid ? 'invalid' : '';

  const updateField = <K extends keyof RegisterFormData>(key: K, value: RegisterFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined, general: undefined }));
  };

  const updateTerms = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, acceptedTerms: checked, acceptedPrivacyPolicy: checked }));
    setErrors((prev) => ({ ...prev, terms: undefined, general: undefined }));
  };

  const nextStep1 = () => {
    const validationErrors = validateStep1(formData);
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextStep2 = () => {
    const validationErrors = validateStep2(formData);
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const previous = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      setSuccessEmail(formData.email || 'você');
      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (result.access?.accessToken) {
        setTimeout(() => router.replace(result.access?.defaultRoute ?? '/connected/dashboard'), 2500);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const maskedCpf = useMemo(() => formData.cpf.replace(/\d(?=\d{2})/g, '•'), [formData.cpf]);

  return (
    <div className="firmeza-register-shell">
      <RegisterStyles />
      <nav>
        <Logo />
        <div className="nav-r">
          <span>Já tem uma conta?</span>
          <button type="button" onClick={() => router.push('/')}>Entrar</button>
        </div>
      </nav>

      <div className="root">
        <SidePanel />

        <main className="form-col">
          <Stepper step={currentStep} />

          {errors.general && (
            <div className="alert" role="alert">
              <AlertTriangle size={16} />
              <div><strong>Revise os dados informados</strong>{errors.general}</div>
            </div>
          )}

          <section className={`step-body ${currentStep === 1 ? 'active' : ''}`}>
            <div className="fh">
              <div className="fh-sup">Passo 1 de 3</div>
              <h2 className="fh-title">Crie seu acesso</h2>
              <p className="fh-sub">Comece com e-mail, senha forte e um telefone para verificação em duas etapas.</p>
            </div>

            <div className="field-stack">
              <div className="f">
                <label htmlFor="email">E-mail <span className="req">*</span></label>
                <div className="iw"><MailIcon /><input id="email" type="email" placeholder="seu@email.com" autoComplete="email" className={inputClass(emailOk, Boolean(formData.email) && !emailOk)} value={formData.email} onChange={(e) => updateField('email', e.target.value)} /></div>
                {formData.email && emailOk ? <span className="hint ok"><Check /> E-mail válido</span> : <ErrorText>{errors.email}</ErrorText>}
              </div>

              <div className="f">
                <label htmlFor="senha">Senha <span className="req">*</span></label>
                <div className="iw hr"><LockIcon /><input id="senha" type={showPassword ? 'text' : 'password'} placeholder="Crie uma senha forte" autoComplete="new-password" className={inputClass(passwordOk, Boolean(formData.password) && !passwordOk)} value={formData.password} onChange={(e) => updateField('password', e.target.value)} /><button className="ir" type="button" onClick={() => setShowPassword((v) => !v)} aria-label="Mostrar senha"><Eye /></button></div>
                <PasswordBars password={formData.password} />
                <ErrorText>{errors.password}</ErrorText>
              </div>

              <div className="f">
                <label htmlFor="senha2">Confirmar senha <span className="req">*</span></label>
                <div className="iw hr"><LockIcon /><input id="senha2" type={showPasswordConfirmation ? 'text' : 'password'} placeholder="Repita a senha" autoComplete="new-password" className={inputClass(matchOk, Boolean(formData.passwordConfirmation) && !matchOk)} value={formData.passwordConfirmation} onChange={(e) => updateField('passwordConfirmation', e.target.value)} /><button className="ir" type="button" onClick={() => setShowPasswordConfirmation((v) => !v)} aria-label="Mostrar senha"><Eye /></button></div>
                {formData.passwordConfirmation && matchOk ? <span className="hint ok"><Check /> Senhas conferem</span> : <ErrorText>{errors.passwordConfirmation}</ErrorText>}
              </div>

              <div className="f">
                <label htmlFor="phone">Telefone <span className="req">*</span></label>
                <div className="iw"><PhoneIcon /><input id="phone" type="tel" placeholder="+55 11 91234-5678" autoComplete="tel" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} /></div>
                <span className="hint"><AlertTriangle /> Usado para verificação em duas etapas</span>
                <ErrorText>{errors.phone}</ErrorText>
              </div>

              <label className="terms-row" htmlFor="terms">
                <input id="terms" type="checkbox" checked={formData.acceptedTerms} onChange={(e) => updateTerms(e.target.checked)} />
                <span>Li e concordo com os <a href="/terms" target="_blank" rel="noopener noreferrer">Termos de Uso</a> e a <a href="/privacy" target="_blank" rel="noopener noreferrer">Política de Privacidade</a> da FirmezaToken</span>
              </label>
              <ErrorText>{errors.terms}</ErrorText>
            </div>

            <div className="btn-row">
              <span style={{ fontSize: 12, color: 'var(--hint)' }}>* campos obrigatórios</span>
              <button className="btn btn-primary" type="button" onClick={nextStep1} disabled={!step1Ready}>Continuar <ChevronRight /></button>
            </div>
          </section>

          <section className={`step-body ${currentStep === 2 ? 'active' : ''}`}>
            <div className="fh">
              <div className="fh-sup">Passo 2 de 3</div>
              <h2 className="fh-title">Seus dados pessoais</h2>
              <p className="fh-sub">Informe seu CPF e nome completo para confirmar sua identidade e habilitar todas as funcionalidades.</p>
            </div>

            <div className="field-stack">
              <div className="f"><label htmlFor="nome">Nome completo <span className="req">*</span></label><div className="iw"><UserIcon /><input id="nome" type="text" placeholder="Como aparece no documento" autoComplete="name" value={formData.fullName} onChange={(e) => updateField('fullName', e.target.value)} /></div><ErrorText>{errors.fullName}</ErrorText></div>
              <div className="f"><label htmlFor="nascimento">Data de nascimento <span className="req">*</span></label><div className="iw"><CalendarIcon /><input id="nascimento" type="text" placeholder="DD/MM/AAAA" maxLength={10} value={formData.birthdate} onChange={(e) => updateField('birthdate', maskBirthdate(e.target.value))} /></div><ErrorText>{errors.birthdate}</ErrorText></div>
              <div className="f"><label htmlFor="cpf">CPF <span className="req">*</span></label><div className="iw"><CpfIcon /><input id="cpf" type="text" placeholder="000.000.000-00" maxLength={14} className={`mono ${inputClass(validateCpf(formData.cpf), Boolean(formData.cpf) && formData.cpf.length === 14 && !validateCpf(formData.cpf))}`} value={formData.cpf} onChange={(e) => updateField('cpf', maskCpf(e.target.value))} /></div>{formData.cpf.length === 14 && validateCpf(formData.cpf) ? <span className="hint ok"><Check /> CPF válido</span> : <ErrorText>{errors.cpf}</ErrorText>}<div className="cpf-note"><Shield />Seu CPF é criptografado e nunca compartilhado com terceiros</div></div>
            </div>

            <div className="btn-row">
              <button className="btn btn-ghost" type="button" onClick={previous}><ChevronLeft /> Voltar</button>
              <button className="btn btn-primary" type="button" onClick={nextStep2} disabled={!step2Ready}>Continuar <ChevronRight /></button>
            </div>
          </section>

          <section className={`step-body ${currentStep === 3 ? 'active' : ''}`}>
            <div className="fh"><div className="fh-sup">Passo 3 de 3</div><h2 className="fh-title">Confirme seus dados</h2><p className="fh-sub">Revise as informações antes de criar sua conta.</p></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 4 }}>
              <ReviewItem icon={<Mail />} title="E-mail" value={formData.email || '—'} />
              <ReviewItem icon={<Phone />} title="Telefone" value={formData.phone || '—'} />
              <ReviewItem icon={<User />} title="Nome" value={formData.fullName || '—'} />
              <ReviewItem icon={<Calendar />} title="Data de nascimento" value={formData.birthdate || '—'} />
              <ReviewItem icon={<CreditCard />} title="CPF" value={maskedCpf || '—'} mono />
            </div>
            <div className="btn-row">
              <button className="btn btn-ghost" type="button" onClick={previous} disabled={isSubmitting}><ChevronLeft /> Editar dados</button>
              <button className="btn btn-primary" type="button" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? <><span className="spinner" /> Criando conta...</> : <><Check /> Criar conta</>}</button>
            </div>
          </section>

          <section className={`step-body ${currentStep === 4 ? 'active' : ''}`}>
            <div className="success-wrap">
              <div className="s-ico"><Check /></div>
              <h2 className="s-title">Conta criada!</h2>
              <p className="s-sub">Bem-vindo à FirmezaToken. Enviamos um e-mail de confirmação para <strong>{successEmail}</strong>. Verifique sua caixa de entrada para ativar a conta.</p>
              <div className="s-items">
                <ReviewItem icon={<Check />} title="Confirmação de e-mail" value="Clique no link enviado para ativar" green />
                <ReviewItem icon={<User />} title="Complete seu perfil" value="Adicione endereço e documentos KYC" />
                <ReviewItem icon={<TrendingUp />} title="Comece a investir" value="Explore imóveis disponíveis na plataforma" blue />
              </div>
              <button className="btn btn-gold btn-full" type="button" onClick={() => router.replace('/connected/dashboard')}>Ir para o Dashboard</button>
            </div>
          </section>
        </main>
        <div className="right-pad" />
      </div>

      <footer><span>© FirmezaToken · A revolução imobiliária começou.</span><div className="fsoc"><a href="#">TikTok</a><a href="#">Instagram</a><a href="#">LinkedIn</a><a href="#">YouTube</a></div></footer>
    </div>
  );
}

function ReviewItem({ icon, title, value, mono, green, blue }: { icon: React.ReactNode; title: string; value: string; mono?: boolean; green?: boolean; blue?: boolean }) {
  return (
    <div className="s-item">
      <div className="s-item-ico" style={green ? { background: 'var(--green-tint)', color: 'var(--green)' } : blue ? { background: 'var(--blue-tint)', color: 'var(--blue)' } : undefined}>{icon}</div>
      <div className="s-item-body"><strong>{title}</strong><span className={mono ? 'mono' : undefined}>{value}</span></div>
    </div>
  );
}
