import type { Metadata } from 'next';
import { RegisterPage } from '../../../features/auth-access/register/RegisterPage';

export const metadata: Metadata = {
  title: 'Criar conta | Propya',
  description: 'Crie sua conta e comece a investir em imóveis tokenizados.',
};

export default function RegisterRoute() {
  return <RegisterPage />;
}
