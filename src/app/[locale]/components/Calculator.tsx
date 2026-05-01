"use client"

import React, { useState, useEffect } from "react";  // Added useEffect import
import { formatCurrency, validateInternationalBrazilianPhone} from "../../../services/format";
import { useLanguage } from "../../context/LanguageContext";
import { useTranslations } from 'next-intl';
import { z } from "zod";
import { UserContactType, createContactUser } from "../../../services/contact-fmz-api";

export default function FirmezaCalculator() {
  const { locale } = useLanguage();
  const t = useTranslations('Calculator');
  const common = useTranslations('Common');

  const [formIncomeMonthly, setFormIncomeMonthly] = useState(3000);
  const [formAge, setFormAge] = useState(30);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [consent, setConsent] = useState<boolean>(false);
  const [leadSent, setLeadSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const lifeExpectancy = 80;
  const remainingYears = lifeExpectancy - formAge;

  const totalIncomeOverLifetime = formIncomeMonthly * 12 * remainingYears;
  const lifetimeRent = formIncomeMonthly * 0.3 * 12 * remainingYears;
  const monthlyRent = formIncomeMonthly * 0.3;

  useEffect(() => {
    setMessage("");
    setError("");
  }, [isSubmitting]);



  // Updated to match the form field names
  const registerSchema = z.object({
    formName: z.string().min(1, "O nome é obrigatório."),
    formEmail: z.string().email("Formato de email inválido."),
    formPhone: z.string().refine(validateInternationalBrazilianPhone, {
      message: "Telefone deve estar no formato +55 XX XXXXXXXXX"
    })
  });
   
  const handleSubmitLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!consent) {
      setMessage("You must consent to the use of your data to continue.");
      return;
    }

    // Validate before setting isSubmitting
    const formData = {
      formName,
      formEmail,
      formPhone,
      formIncomeMonthly,
      formAge,
      totalIncomeOverLifetime,
      lifetimeRent,
    };

    try {
      // Validate before proceeding
      registerSchema.parse(formData);
      
      setIsSubmitting(true);

      const registerData: UserContactType = {
        name: formData.formName,
        email: formData.formEmail,
        phone: formData.formPhone,
        type: "Calculator",
        age: formData.formAge.toString(), 
        salary: formData.formIncomeMonthly.toString(), 
      };

      const response = await createContactUser(registerData);
      
      // Consistent response handling
      if (response.success) {
        setLeadSent(true);
        setMessage("Usuário criado com sucesso. Faça o login.");
      } else {
        setError(response.message || "Erro ao criar usuário");
      }
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        setError(validationError.errors.map((e) => e.message).join(" "));
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto items-start ">
      <div className="text-left mb-2">
        <h3 className="text-blue-500 uppercase tracking-wide font-semibold text-sm">
          {t('calculator')}
        </h3>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2"> 
          {t('calcTitle')}
        </h1>
        <p className="text-xs text-gray-600"> 
          {t('info')}
        </p>
      </div>

      {/* Primeira Seção: Entrada de dados e resultados lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Card de Entrada */}
        <div className="bg-white p-3 rounded-xl shadow-md border border-gray-200">
          <h2 className="font-bold text-xl mb-3 text-gray-900">{t('inputTitle')}</h2> 

          <div className="space-y-3"> 
            <div className="bg-gray-50 p-3 rounded-lg shadow-inner">
              <label className="block mb-1 font-semibold text-gray-700 text-sm"> 
                {t('labelIncomeMonthly')}
                <div className="flex items-center">
                  <input
                    type="range"
                    className="w-full mr-3"
                    style={{ accentColor: '#4f46e5' }}
                    value={formIncomeMonthly}
                    onChange={(e) => setFormIncomeMonthly(Number(e.target.value))}
                    min={1000}
                    max={50000}
                    step={500}
                  />
                  <input
                    type="number"
                    className="w-20 border border-gray-300 rounded-lg p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                    value={formIncomeMonthly}
                    onChange={(e) => setFormIncomeMonthly(Number(e.target.value))}
                    min={1000}
                    max={50000}
                  />
                </div>
              </label>

              <label className="block mt-3 font-semibold text-gray-700 text-sm">
                {t('labelAge')}
                <div className="flex items-center">
                  <input
                    type="range"
                    className="w-full mr-3"
                    style={{ accentColor: '#4f46e5' }}
                    value={formAge}
                    onChange={(e) => setFormAge(Number(e.target.value))}
                    min={18}
                    max={79}
                  />
                  <input
                    type="number"
                    className="w-12 border border-gray-300 rounded-lg p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                    value={formAge}
                    onChange={(e) => {
                      if (e.target.value === '') {
                        setFormAge(0);
                        return;
                      }

                      const numValue = Number(e.target.value);
                      if (!isNaN(numValue)) {
                        setFormAge(numValue);
                      }
                    }}
                    onBlur={(e) => {
                      const numValue = Number(e.target.value);

                      if (isNaN(numValue) || numValue < 18) {
                        setFormAge(18);
                      } else if (numValue > 79) {
                        setFormAge(79);
                      }
                    }}
                    min={18}
                    max={79}
                    onKeyDown={(e) => {
                      const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
                      const isNumber = /^[0-9]$/.test(e.key);

                      if (!isNumber && !allowedKeys.includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl shadow-md border border-gray-200">
          <h2 className="font-bold text-xl mb-3 text-gray-900">{t('resultTitle')}</h2>

          <table className="bg-gray-50 rounded-lg mb-3 w-full text-sm">
            <tbody>
              <tr>
                <td colSpan={2} className="bg-indigo-50 py-3 px-2 rounded-t-lg">
                  <div>
                    {t('calcYears')}&nbsp;
                    <span className="font-bold text-left">{remainingYears} {t('years')}</span>
                    &nbsp;{t('resultYears')}
                  </div>
                </td>
              </tr>

              <tr>
                <td className="py-1 px-4 text-gray-900">{t('resultIncomeTotal')}&nbsp;
                </td>
                <td className="py-1 px-4 text-gray-900 text-right font-bold">{formatCurrency.format(totalIncomeOverLifetime)}</td>
              </tr>

              <tr>
                <td className="py-1 px-4 text-gray-900">{t('resultLifetimeRent')}&nbsp;
                </td>
                <td className="py-1 px-4 text-gray-900 text-right font-bold">{formatCurrency.format(lifetimeRent)}</td>
              </tr>

              <tr>
                <td className="py-1 px-4 pb-3 text-gray-900">{t('monthlyPayment')}</td>
                <td className="py-1 px-4 pb-3 text-gray-900 text-right font-bold">
                  {formatCurrency.format(monthlyRent)}/{t('month')}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-center">
            <button
              onClick={() => {
                const el = document.getElementById('contactForm');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="bg-blue-600 text-xs text-white font-bold px-8 py-2 mb-4 rounded-full hover:bg-blue-700 transition">
              {t('formButton')}
            </button>
          </div>
        </div>
      </div>

      <div id="contactForm" className="bg-white p-4 rounded-xl shadow-md border border-gray-200 mb-4">
        <h2 className="font-bold text-xl mb-3 text-gray-900">{t('contactTitle')}</h2>
        <p className="mb-3 text-xs text-gray-600">
          {t('contactInfo')}
        </p>
        
        {/* Display success/error messages */}
        {message && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200 mb-3">
            <p className="text-green-600 text-sm">{message}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 p-3 rounded-lg border border-red-200 mb-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        {leadSent ? (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-green-600 font-semibold text-center text-sm">{t('contactThankYou')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmitLead} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="w-full">
              <input
                type="text"
                placeholder={t('formName')}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            <div className="w-full">
              <input
                type="email"
                placeholder={t('formEmail')}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
              />
            </div>
            <div className="w-full">
              <input
                type="tel"
                placeholder="+55 XX XXXXXXXXX"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                required
              />
            </div>

            <div className="md:col-span-3 flex flex-col items-center justify-center">
              <div className="mb-4 self-start">
                <input
                  type="checkbox"
                  id="consent"
                  name="consent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <label htmlFor="consent" className="ml-2 text-sm font-medium" style={{ color: '#808285' }}>
                  {t('consentText')}
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !consent}
                className="bg-blue-600 text-xs text-white font-bold px-8 py-2 mb-4 rounded-full hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed">
                {isSubmitting ? t('formSubmitting') : t('formButton')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}