import { z } from 'zod';
import { isValidFmzEmail } from '../../auth-access/domain/fmz-auth-access-validation';

export const buildFmzRequestPasswordResetSchema = () => z.object({
  email: z.string().trim().refine(isValidFmzEmail, 'Esse e-mail parece incompleto. Verifique e tente novamente.'),
});

export const buildFmzResetPasswordSchema = () => z.object({
  token: z.string().trim().min(1, 'Link de redefinição inválido. Solicite um novo link.'),
  password: z.string().min(1, 'A senha não pode estar em branco.'),
  confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'A confirmação de senha precisa ser igual à senha informada.',
  path: ['confirmPassword'],
});
