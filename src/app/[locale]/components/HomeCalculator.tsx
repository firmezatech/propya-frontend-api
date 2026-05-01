"use client";

import React, { useRef, useState, useEffect } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { LoginType, login, UserType, createUser } from "../../../services/login-fmz-api";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { useLanguage } from "../../context/LanguageContext";
import FirmezaCalculator from "./Calculator";
import { validateInternationalBrazilianPhone } from "../../../services/format";
import { setFirmezaAccessToken } from "../../../services/auth/auth-storage";

export default function Home() {
  const { locale } = useLanguage();
  const t = useTranslations('HomePage');

  const form = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [name, setName] = useState("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    setMessage("");
    setError("");
  }, [isRegistering]);


  const handleForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (form.current) {
      try {
        const formData = new FormData(form.current);
        const formObject = Object.fromEntries(formData.entries());

        if (!isRegistering) {
          const userSchema = z.object({
            email: z.string().email("Formato de email inválido."),
            password: z.string().min(1, "A senha deve ter ao menos 1 caractere."),
          });

          userSchema.parse(formObject);

          const loginData: LoginType = {
            email: formObject.email as string,
            password: formObject.password as string,
          };

          const response = await login(loginData);

          if (!response.success) {
            setError(response.message);
          } else {
            if (response.accessToken) {
              setFirmezaAccessToken(response.accessToken);
            }
            localStorage.setItem("name", response.name);
            localStorage.setItem("wallet", response.wallet);
            localStorage.setItem("profile", response.profile.toString());
            form.current.reset();
            router.replace("/connected/dashboard");
          }
        } else {
          const registerSchema = z.object({
            name: z.string().min(1, "O nome é obrigatório."),
            email: z.string().email("Formato de email inválido."),
            phone: z.string().refine(validateInternationalBrazilianPhone, {
              message: "Telefone deve estar no formato +55 XX XXXXXXXXX"
            }),
            birthdate: z.string().refine((date) => {
              // Regex para validar o formato DD/MM/AAAA
              const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

              if (!dateRegex.test(date)) {
                return false;
              }

              // Validar se é uma data válida
              const [day, month, year] = date.split('/').map(Number);
              const dateObject = new Date(year, month - 1, day);

              // Verificar se a data é válida (ex: 31/02/2023 não é válido)
              const isValidDate = dateObject.getDate() === day &&
                dateObject.getMonth() === month - 1 &&
                dateObject.getFullYear() === year;

              // Verificar se a data não está no futuro
              const today = new Date();
              const isNotFuture = dateObject <= today;

              // Verificar idade mínima (opcional - ajuste conforme necessário)
              const minAgeDate = new Date();
              minAgeDate.setFullYear(minAgeDate.getFullYear() - 18); // Exemplo: 18 anos
              const isAdult = dateObject <= minAgeDate;

              return isValidDate && isNotFuture && isAdult;
            }, {
              message: "Data de nascimento deve estar no formato DD/MM/AAAA e ser uma data válida para uma pessoa maior de 18 anos."
            }),
            password: z.string().min(1, "A senha deve ter ao menos 1 caractere."),
            confirmPassword: z.string().min(1, "Confirmar a Senha é obrigatório."),
          }).refine((data) => data.password === data.confirmPassword, {
            message: "Senhas não conferem.",
            path: ["confirmPassword"],
          });
          registerSchema.parse(formObject);
          const registerData: UserType = {
            name: formObject.name as string,
            email: formObject.email as string,
            phone: formObject.phone as string,
            birthdate: formObject.birthdate as string,
            password: formObject.password as string,
            confirmPassword: formObject.confirmPassword as string,
          };
          const response = await createUser(registerData);
          if (!response.success) {
            setError(response.message);
          } else {
            setMessage("Usuário criado com sucesso. Faça o login.");
          }
        }
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          setError(validationError.errors.map((e) => e.message).join(" "));
        }
      }
    }
  };

  return (
    <>
      <section className="flex flex-col justify-start items-center bg-white py-2 gap-20 mb-36">
        <div className="w-11/12 max-w-7xl mx-auto flex flex-col lg:flex-row items-start justify-between gap-6 px-2">
          <div className="lg:w-3/5 text-left">
            <h3 className="text-blue-500 uppercase tracking-wide font-semibold text-sm">
              {t('title')}
            </h3>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
              {t('subtitle')}
            </h1>
            <p className="text-gray-600 mt-4">
              {t('description')}
            </p>
            <div className="mt-16">
              <FirmezaCalculator />
            </div>
          </div>

          <div className="lg:w-2/5 w-full items-right max-w-md p-6 py-4 rounded-2xl border bg-white" >
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">{t('login')}</h2>
            <form ref={form} onSubmit={handleForm} className="space-y-4">

              {isRegistering && (
                <>
                  <div>
                    <label className="block text-left text-gray-700 font-medium">{t('email')}</label>
                    <input
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      type="email"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('enterEmail')}
                      name="email"
                      required
                      aria-label="Digite seu e-mail"
                    />
                  </div>
                  <div>
                    <label className="block text-left text-gray-700 font-medium">{t('name')}</label>
                    <input
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                      type="text"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('enterName')}
                      name="name"
                      required
                      aria-label="Digite seu nome"
                    />
                  </div>

                  <div>
                    <label className="block text-left text-gray-700 font-medium">{t('phone')}</label>
                    <input
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                      type="text"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('enterPhone')}
                      name="phone"
                      required
                      aria-label="Digite seu telefone(WhatsApp)"
                    />
                  </div>

                  <div>
                    <label className="block text-left text-gray-700 font-medium">{t('birthdate')}</label>
                    <input
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBirthdate(e.target.value)}
                      type="text"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('enterBirthdate')}
                      name="birthdate"
                      required
                      aria-label="Digite sua data de nascimento"
                    />
                  </div>

                  <div>
                    <label className="block text-left text-gray-700 font-medium">{t('password')}</label>
                    <input
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      type="password"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('enterPassword')}
                      name="password"
                      required
                      aria-label="Digite sua senha"
                    />
                  </div>

                  <div>
                    <label className="block text-left text-gray-700 font-medium">{t('confirmPassword')}</label>
                    <input
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                      type="password"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('confirmPasswordPlaceholder')}
                      name="confirmPassword"
                      required
                      aria-label="Confirme a senha"
                    />
                  </div>
                </>
              )}

              {!isRegistering && (
                <>
                  <div>
                    <label className="block text-left text-gray-700 font-medium">{t('email')}</label>
                    <input
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      type="email"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('enterEmail')}
                      name="email"
                      autoComplete="email"
                      required
                      aria-label="Digite seu e-mail"
                    />
                  </div>
                  <div>
                    <label className="block text-left text-gray-700 font-medium">{t('password')}</label>
                    <input
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      type="password"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('enterPassword')}
                      name="password"
                      autoComplete="current-password"
                      required
                      aria-label="Digite sua senha"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
                  >
                    {t('login')}
                  </button>
                  <p className="text-gray-600 text-sm text-center mt-4">
                    {t('notAccountYet')}{" "}
                    <Link
                      href="#"
                      onClick={() => {
                        setIsRegistering(!isRegistering);
                      }}
                      className="text-blue-500 hover:underline"
                    >
                      {t('register')}
                    </Link>
                  </p> 
                </>
              )}
              {isRegistering && (
                <>
                  <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">{t('register')}</button>

                  <p className="text-gray-600 text-sm text-center mt-4">
                    {t('alreadyHaveAccount')}{" "}
                    <Link
                      href="/"
                      onClick={() => {
                        setIsRegistering(false);
                      }}
                      className="text-blue-500 hover:underline"
                    >
                      {t('linkLogin')}
                    </Link>
                  </p>
                </>)
              }
            </form>
            {message && <p className="text-green-500 text-center">{message}</p>}
            {error && <p className="text-red-500 text-center">{error}</p>}
          </div>
        </div>
      </section>
    </>
  );
}