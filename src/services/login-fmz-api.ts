import { firmezaApiClient } from './firmeza-api-client';
import { setFirmezaAccessToken } from './auth/auth-storage';
import { normalizeFmzApiError, type FmzNormalizedApiError } from '../features/api-errors/domain';

export type LoginType = {
  email?: string;
  password?: string;
};

export type UserType = {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  birthdate?: string;
  password?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  wallet?: string;
  createdAt?: string;
  profile?: number;
};

export type RequestPasswordResetType = {
  email: string;
};

export type ResetPasswordType = {
  token: string;
  password: string;
  confirmPassword: string;
};

type FmzApiSuccess<T> = T & {
  success: true;
  message: string;
};

type FmzApiFailure = {
  success: false;
  error: FmzNormalizedApiError;
};

export type FmzApiResult<T> = FmzApiSuccess<T> | FmzApiFailure;

export type LoginResponse = FmzApiResult<{
  accessToken?: string;
  wallet?: string;
  name?: string;
  profile?: number;
}>;

export type CreateUserResponse = FmzApiResult<{}>;

export type PasswordResetResponse = FmzApiResult<{}>;

export type ListUserResponse = {
  success: boolean;
  message: string;
  users?: UserType[];
  error?: FmzNormalizedApiError;
};

const getSuccessMessage = (data: Record<string, unknown>, fallback: string): string => (
  String(data.message || data.msg || fallback)
);

export async function login(user: LoginType): Promise<LoginResponse> {
  try {
    const response = await firmezaApiClient.post('/login', {
      email: user.email,
      password: user.password,
    });

    const accessToken = response.data.accessToken || response.data.token;

    if (accessToken) {
      setFirmezaAccessToken(accessToken);
    }

    return {
      success: true,
      message: getSuccessMessage(response.data, 'Login realizado com sucesso.'),
      accessToken,
      wallet: response.data.wallet,
      name: response.data.name,
      profile: response.data.profile,
    };
  } catch (error) {
    return { success: false, error: normalizeFmzApiError(error) };
  }
}

export async function createUser(user: UserType): Promise<CreateUserResponse> {
  try {
    const response = await firmezaApiClient.post('/createUser', {
      name: user.name,
      email: user.email,
      phone: user.phone,
      birthdate: user.birthdate,
      password: user.password,
      confirmPassword: user.confirmPassword,
    });

    return {
      success: true,
      message: getSuccessMessage(response.data, 'Usuário criado com sucesso.'),
    };
  } catch (error) {
    return { success: false, error: normalizeFmzApiError(error) };
  }
}

export async function requestPasswordReset(payload: RequestPasswordResetType): Promise<PasswordResetResponse> {
  try {
    const response = await firmezaApiClient.post('/requestPasswordReset', {
      email: payload.email,
    });

    return {
      success: true,
      message: getSuccessMessage(response.data, 'Enviamos as instruções para redefinir sua senha.'),
    };
  } catch (error) {
    return { success: false, error: normalizeFmzApiError(error) };
  }
}

export async function resetPassword(payload: ResetPasswordType): Promise<PasswordResetResponse> {
  try {
    const response = await firmezaApiClient.post('/resetPassword', {
      token: payload.token,
      password: payload.password,
      confirmPassword: payload.confirmPassword,
    });

    return {
      success: true,
      message: getSuccessMessage(response.data, 'Senha redefinida com sucesso.'),
    };
  } catch (error) {
    return { success: false, error: normalizeFmzApiError(error) };
  }
}

export async function listUser(): Promise<ListUserResponse> {
  try {
    const response = await firmezaApiClient.get('/listUsers');

    return {
      success: true,
      message: '',
      users: response.data.users,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Não foi possível carregar a lista de usuários.',
      error: normalizeFmzApiError(error),
    };
  }
}

export async function getUserByWallet(wallet: string): Promise<UserType | null> {
  if (!wallet) return null;

  try {
    const response = await firmezaApiClient.post('/getUserByWallet', { wallet });
    return response.data?.user ?? null;
  } catch {
    return null;
  }
}

export type UpdateUserResponse = FmzApiResult<{
  data?: {
    user?: UserType;
  };
}>;

export async function updateUser(user: UserType): Promise<UpdateUserResponse> {
  try {
    const response = await firmezaApiClient.put('/updateUser', {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      birthdate: user.birthdate,
      currentPassword: user.currentPassword,
      newPassword: user.newPassword,
      confirmPassword: user.confirmPassword,
    });

    return {
      success: true,
      message: getSuccessMessage(response.data, 'Usuário atualizado com sucesso.'),
      data: response.data as { user?: UserType },
    };
  } catch (error) {
    return { success: false, error: normalizeFmzApiError(error) };
  }
}
