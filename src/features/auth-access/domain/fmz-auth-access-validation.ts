import { z } from 'zod';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BIRTHDATE_PATTERN = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

const parseBrazilianBirthdate = (birthdate: string): Date | null => {
  if (!BIRTHDATE_PATTERN.test(birthdate)) return null;

  const [day, month, year] = birthdate.split('/').map(Number);
  const parsedDate = new Date(year, month - 1, day);

  const isSameDate = parsedDate.getDate() === day
    && parsedDate.getMonth() === month - 1
    && parsedDate.getFullYear() === year;

  return isSameDate ? parsedDate : null;
};

const getMinimumBirthdate = (minimumAge: number): Date => {
  const minimumBirthdate = new Date();
  minimumBirthdate.setFullYear(minimumBirthdate.getFullYear() - minimumAge);
  minimumBirthdate.setHours(23, 59, 59, 999);
  return minimumBirthdate;
};

export const isValidFmzEmail = (email: string): boolean => EMAIL_PATTERN.test(email.trim());

export const isValidAdultBirthdate = (birthdate: string, minimumAge: number): boolean => {
  const parsedBirthdate = parseBrazilianBirthdate(birthdate);
  if (!parsedBirthdate) return false;

  return parsedBirthdate <= getMinimumBirthdate(minimumAge);
};

export const buildFmzLoginSchema = () => z.object({
  email: z.string().trim().refine(isValidFmzEmail, 'Formato de email inválido.'),
  password: z.string().min(1, 'A senha deve ter ao menos 1 caractere.'),
});

export const buildFmzRegistrationSchema = (minimumAge: number) => z.object({
  name: z.string().trim().min(1, 'O nome é obrigatório.'),
  email: z.string().trim().refine(isValidFmzEmail, 'Formato de email inválido.'),
  phone: z.string().trim().min(1, 'Telefone é obrigatório.'),
  phoneCountry: z.string().trim().min(1, 'País do telefone é obrigatório.'),
  birthdate: z.string().refine(
    (birthdate) => isValidAdultBirthdate(birthdate, minimumAge),
    `Data de nascimento deve estar no formato DD/MM/AAAA e ser válida para uma pessoa maior de ${minimumAge} anos.`,
  ),
  password: z.string().min(1, 'A senha deve ter ao menos 1 caractere.'),
  confirmPassword: z.string().min(1, 'Confirmar a Senha é obrigatório.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem.',
  path: ['confirmPassword'],
});
