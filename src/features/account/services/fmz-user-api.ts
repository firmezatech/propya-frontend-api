import { firmezaApiClient } from '../../../services/firmeza-api-client';
import { normalizeFmzApiError } from '../../api-errors/domain';
import type { UserType, UpdateUserResponse, ListUserResponse } from '../domain/fmz-user.types';

export async function getUserByWallet(wallet: string): Promise<UserType | null> {
  if (!wallet) return null;

  try {
    const response = await firmezaApiClient.post('/getUserByWallet', { wallet });
    return response.data?.user ?? null;
  } catch {
    return null;
  }
}

export async function updateUser(user: UserType): Promise<UpdateUserResponse> {
  try {
    const response = await firmezaApiClient.put('/updateUser', {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      phoneCountry: user.phoneCountry,
      birthdate: user.birthdate,
      address: user.address,
      addressLine1: user.addressLine1,
      addressLine2: user.addressLine2,
      district: user.district,
      city: user.city,
      state: user.state,
      postalCode: user.postalCode,
      country: user.country,
      ...(user.currentPassword?.trim() || user.newPassword?.trim() || user.confirmPassword?.trim() ? {
        currentPassword: user.currentPassword,
        newPassword: user.newPassword,
        confirmPassword: user.confirmPassword,
      } : {}),
    });

    return {
      success: true,
      message: String(response.data?.message || response.data?.msg || 'Usuário atualizado com sucesso.'),
      data: response.data as { user?: UserType },
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
