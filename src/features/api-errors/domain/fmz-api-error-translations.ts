import { FMZ_API_ERROR_CODES, type FmzApiErrorCode } from './fmz-api-error-codes';

export type FmzApiErrorSeverity = 'error' | 'warning';

export type FmzApiErrorMessage = {
  title: string;
  description: string;
  severity: FmzApiErrorSeverity;
  field?: 'email' | 'password' | 'confirmPassword' | 'phone' | 'birthdate' | 'name';
};

export const FMZ_DEFAULT_API_ERROR_MESSAGE: FmzApiErrorMessage = Object.freeze({
  title: 'Não foi possível concluir a solicitação',
  description: 'Tente novamente em instantes. Se o problema continuar, entre em contato com o suporte.',
  severity: 'error',
});

export const FMZ_SERVER_API_ERROR_MESSAGE: FmzApiErrorMessage = Object.freeze({
  title: 'Serviço temporariamente indisponível',
  description: 'Não conseguimos processar sua solicitação agora. Tente novamente em alguns minutos.',
  severity: 'error',
});

export const FMZ_API_ERROR_MESSAGES_PT_BR: Record<FmzApiErrorCode, FmzApiErrorMessage> = Object.freeze({
  [FMZ_API_ERROR_CODES.REQUIRED_FIELD_MISSING]: {
    title: 'Campos obrigatórios',
    description: 'Preencha todos os campos obrigatórios para continuar.',
    severity: 'error',
  },
  [FMZ_API_ERROR_CODES.VALIDATION_ERROR]: {
    title: 'Revise os dados informados',
    description: 'Alguns dados parecem incorretos. Corrija os campos destacados e tente novamente.',
    severity: 'error',
  },
  [FMZ_API_ERROR_CODES.INVALID_EMAIL]: {
    title: 'E-mail inválido',
    description: 'Esse e-mail parece incompleto. Verifique e tente novamente.',
    severity: 'error',
    field: 'email',
  },
  [FMZ_API_ERROR_CODES.EMAIL_ALREADY_EXISTS]: {
    title: 'E-mail já cadastrado',
    description: 'Já existe uma conta com esse e-mail. Faça login ou use outro endereço.',
    severity: 'error',
    field: 'email',
  },
  [FMZ_API_ERROR_CODES.EMAIL_NOT_FOUND]: {
    title: 'Conta não encontrada',
    description: 'Não encontramos uma conta com esse e-mail. Verifique se digitou corretamente ou cadastre-se.',
    severity: 'error',
    field: 'email',
  },
  [FMZ_API_ERROR_CODES.USER_NOT_FOUND]: {
    title: 'Conta não encontrada',
    description: 'Não encontramos uma conta com esses dados. Verifique as informações e tente novamente.',
    severity: 'error',
    field: 'email',
  },
  [FMZ_API_ERROR_CODES.INVALID_PASSWORD]: {
    title: 'Senha inválida',
    description: 'A senha informada não atende aos critérios necessários.',
    severity: 'error',
    field: 'password',
  },
  [FMZ_API_ERROR_CODES.INVALID_CREDENTIALS]: {
    title: 'Não conseguimos entrar',
    description: 'E-mail e senha não coincidem. Confira os dados ou use “Esqueci minha senha”.',
    severity: 'error',
    field: 'password',
  },
  [FMZ_API_ERROR_CODES.PASSWORDS_DO_NOT_MATCH]: {
    title: 'Senhas não conferem',
    description: 'A confirmação de senha precisa ser igual à senha informada.',
    severity: 'error',
    field: 'confirmPassword',
  },
  [FMZ_API_ERROR_CODES.INVALID_PHONE_NUMBER]: {
    title: 'Telefone inválido',
    description: 'Informe um número de telefone válido para o país selecionado.',
    severity: 'error',
    field: 'phone',
  },
  [FMZ_API_ERROR_CODES.INVALID_PHONE_COUNTRY]: {
    title: 'País do telefone inválido',
    description: 'Selecione um código de país válido para continuar.',
    severity: 'error',
    field: 'phone',
  },
  [FMZ_API_ERROR_CODES.INVALID_BIRTHDATE]: {
    title: 'Data de nascimento inválida',
    description: 'Informe uma data válida no formato DD/MM/AAAA.',
    severity: 'error',
    field: 'birthdate',
  },
  [FMZ_API_ERROR_CODES.USER_UNDER_MINIMUM_AGE]: {
    title: 'Cadastro não permitido',
    description: 'Você precisa ter pelo menos 18 anos para criar uma conta.',
    severity: 'error',
    field: 'birthdate',
  },
  [FMZ_API_ERROR_CODES.TOO_MANY_LOGIN_ATTEMPTS]: {
    title: 'Muitas tentativas seguidas',
    description: 'Por segurança, o acesso foi bloqueado temporariamente. Tente novamente em instantes ou redefina sua senha.',
    severity: 'warning',
  },
  [FMZ_API_ERROR_CODES.LOGIN_ATTEMPTS_EXCEEDED]: {
    title: 'Muitas tentativas seguidas',
    description: 'Por segurança, o acesso foi bloqueado temporariamente. Tente novamente em instantes ou redefina sua senha.',
    severity: 'warning',
  },
  [FMZ_API_ERROR_CODES.ACCOUNT_TEMPORARILY_LOCKED]: {
    title: 'Acesso temporariamente bloqueado',
    description: 'Por segurança, bloqueamos novas tentativas por alguns minutos. Tente novamente mais tarde ou redefina sua senha.',
    severity: 'warning',
  },
  [FMZ_API_ERROR_CODES.PASSWORD_RESET_TOKEN_REQUIRED]: {
    title: 'Link de redefinição inválido',
    description: 'Solicite um novo link de redefinição de senha para continuar.',
    severity: 'error',
  },
  [FMZ_API_ERROR_CODES.PASSWORD_RESET_TOKEN_INVALID]: {
    title: 'Link de redefinição inválido',
    description: 'Esse link não é válido. Solicite uma nova redefinição de senha.',
    severity: 'error',
  },
  [FMZ_API_ERROR_CODES.PASSWORD_RESET_TOKEN_EXPIRED]: {
    title: 'Link expirado',
    description: 'O link de redefinição expirou. Solicite um novo link para criar uma nova senha.',
    severity: 'warning',
  },
  [FMZ_API_ERROR_CODES.PASSWORD_RESET_REQUEST_FAILED]: {
    title: 'Não foi possível solicitar a redefinição',
    description: 'Verifique o e-mail informado e tente novamente.',
    severity: 'error',
    field: 'email',
  },
  [FMZ_API_ERROR_CODES.RESET_PASSWORD_FAILED]: {
    title: 'Não foi possível redefinir a senha',
    description: 'Verifique as informações e tente novamente.',
    severity: 'error',
  },
  [FMZ_API_ERROR_CODES.EMAIL_VERIFICATION_REQUIRED]: {
    title: 'E-mail não verificado',
    description: 'Você precisa confirmar seu e-mail antes de acessar a plataforma. Verifique sua caixa de entrada.',
    severity: 'warning',
  },
  [FMZ_API_ERROR_CODES.EMAIL_VERIFICATION_TOKEN_REQUIRED]: {
    title: 'Link de verificação inválido',
    description: 'O link que você acessou não contém um token de verificação. Use o link enviado para o seu e-mail.',
    severity: 'error',
  },
  [FMZ_API_ERROR_CODES.INVALID_EMAIL_VERIFICATION_TOKEN]: {
    title: 'Link de verificação inválido',
    description: 'Esse link não é válido ou já foi utilizado. Verifique se copiou o link correto do e-mail.',
    severity: 'error',
  },
  [FMZ_API_ERROR_CODES.EXPIRED_EMAIL_VERIFICATION_TOKEN]: {
    title: 'Link expirado',
    description: 'O link de verificação expirou. Faça login para receber um novo link por e-mail.',
    severity: 'warning',
  },
  [FMZ_API_ERROR_CODES.UNAUTHORIZED]: {
    title: 'Sessão expirada',
    description: 'Faça login novamente para continuar.',
    severity: 'warning',
  },
  [FMZ_API_ERROR_CODES.FORBIDDEN]: {
    title: 'Acesso não permitido',
    description: 'Seu usuário não tem permissão para realizar essa ação.',
    severity: 'error',
  },
  [FMZ_API_ERROR_CODES.INTERNAL_SERVER_ERROR]: FMZ_SERVER_API_ERROR_MESSAGE,
  [FMZ_API_ERROR_CODES.UNKNOWN_ERROR]: FMZ_DEFAULT_API_ERROR_MESSAGE,
});
