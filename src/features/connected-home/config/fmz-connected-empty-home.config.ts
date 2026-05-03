import { fmzPublicLayoutConfig } from '../../../config/fmz-public-layout-config';

const getPublicEnvValue = (key: string, fallback: string): string => {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
};

export const fmzConnectedEmptyHomeConfig = {
  eyebrow: getPublicEnvValue('NEXT_PUBLIC_FMZ_EMPTY_HOME_EYEBROW', '✦ Sua jornada começa aqui'),
  title: getPublicEnvValue('NEXT_PUBLIC_FMZ_EMPTY_HOME_TITLE', 'Ainda não há nada por aqui'),
  description: getPublicEnvValue(
    'NEXT_PUBLIC_FMZ_EMPTY_HOME_DESCRIPTION',
    'Você ainda não possui investimentos. Explore as oportunidades e dê o primeiro passo.',
  ),
  ctaLabel: getPublicEnvValue('NEXT_PUBLIC_FMZ_EMPTY_HOME_CTA_LABEL', 'Completar meu perfil'),
  ctaPath: fmzPublicLayoutConfig.connectedAccountPath,
  steps: [
    {
      id: 'profile',
      number: getPublicEnvValue('NEXT_PUBLIC_FMZ_EMPTY_HOME_STEP_PROFILE_NUMBER', '01'),
      title: getPublicEnvValue('NEXT_PUBLIC_FMZ_EMPTY_HOME_STEP_PROFILE_TITLE', 'Complete seu perfil'),
      description: getPublicEnvValue('NEXT_PUBLIC_FMZ_EMPTY_HOME_STEP_PROFILE_DESCRIPTION', 'Verifique seus dados'),
    },
    {
      id: 'properties',
      number: getPublicEnvValue('NEXT_PUBLIC_FMZ_EMPTY_HOME_STEP_PROPERTIES_NUMBER', '02'),
      title: getPublicEnvValue('NEXT_PUBLIC_FMZ_EMPTY_HOME_STEP_PROPERTIES_TITLE', 'Explore imóveis'),
      description: getPublicEnvValue('NEXT_PUBLIC_FMZ_EMPTY_HOME_STEP_PROPERTIES_DESCRIPTION', 'Oportunidades disponíveis'),
    },
    {
      id: 'investment',
      number: getPublicEnvValue('NEXT_PUBLIC_FMZ_EMPTY_HOME_STEP_INVESTMENT_NUMBER', '03'),
      title: getPublicEnvValue('NEXT_PUBLIC_FMZ_EMPTY_HOME_STEP_INVESTMENT_TITLE', 'Invista a partir de R$500'),
      description: getPublicEnvValue('NEXT_PUBLIC_FMZ_EMPTY_HOME_STEP_INVESTMENT_DESCRIPTION', 'Com blockchain'),
    },
  ],
} as const;
