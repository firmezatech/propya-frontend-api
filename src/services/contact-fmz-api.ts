import axios from 'axios';
import { firmezaApiClient } from './firmeza-api-client';
import { buildAdminPaginationParams, normalizeAdminPaginatedPayload, type FmzAdminPaginationMeta, type FmzAdminPaginationRequest } from '../features/admin-pagination';

export type UserContactType = {
  name?: string;
  email?: string;
  phone?: string;
  type?: string;
  age?: string;
  salary?: string;
  createdAt?: string;
};

export type ListContactUserResponse = {
  success: boolean;
  message: string;
  users?: UserContactType[];
  pagination?: FmzAdminPaginationMeta;
};

export async function createContactUser(user: UserContactType): Promise<any> {
  if (!user.name || !user.email || !user.phone || !user.type) {
    throw new Error("All fields are required.");
  }

  try {
    const response = await firmezaApiClient.post(`/createContactUser`, {
      name: user.name,
      email: user.email,
      phone: user.phone,
      type: user.type,
      age: user.age,
      salary: user.salary,
    });
    return { success: true, message: response.data.msg };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return { success: false, message: err.response.data.msg }; 
    } else {
      return { success: false, message: "An unknown error occurred." };
    }
  }
}

export async function listContactUser(request: FmzAdminPaginationRequest = {}): Promise<ListContactUserResponse> {
  try {
    const response = await firmezaApiClient.get(`/listContactUsers`, {
      params: buildAdminPaginationParams(request),
    });
    const result = normalizeAdminPaginatedPayload<UserContactType>(
      response.data,
      ['users', 'contacts', 'contactUsers'],
      (item) => item as UserContactType,
      request,
    );

    return {
      success: true,
      message: "",
      users: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPreviousPage: result.hasPreviousPage,
      },
    };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return {
        success: false,
        message: err.response.data.msg || "An error occurred while fetching the user list.",
      };
    } else {
      return {
        success: false,
        message: "An unknown error occurred while fetching the user list.",
      };
    }
  }
}