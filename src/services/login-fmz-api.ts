import axios from 'axios';
import { firmezaApiClient } from './firmeza-api-client';
import { setFirmezaAccessToken } from './auth/auth-storage';

export type LoginType = {
  email?: string;
  password?: string;
};

export type UserType = {
  _id?: string,
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

export type ListUserResponse = {
  success: boolean;
  message: string;
  users?: UserType[];  
};

export async function login(user: LoginType): Promise<any> {

  if (!user.email || !user.password)
    throw new Error("All fields are required.");

  try {
    const response = await firmezaApiClient.post(`/login`, {
      email: user.email,
      password: user.password,
    });

    const accessToken = response.data.accessToken || response.data.token;

    if (accessToken) {
      setFirmezaAccessToken(accessToken);
    }

    return {
      success: true,
      message: response.data.msg,
      accessToken,
      wallet: response.data.wallet,
      name: response.data.name,
      profile: response.data.profile
    }; 
    
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return { success: false, message: err.response.data.msg }; 
    } else {
      return { success: false, message: "An unknown error occurred." };
    }
  }
}

export async function createUser(user: UserType): Promise<any> {
  if (!user.name || !user.email || !user.phone || !user.birthdate ||
     !user.password || !user.confirmPassword) {
    throw new Error("All fields are required.");
  }

  try {
    const response = await firmezaApiClient.post(`/createUser`, {
      name: user.name,
      email: user.email,
      phone: user.phone,
      birthdate: user.birthdate,
      password: user.password,
      confirmPassword: user.confirmPassword,
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

export async function listUser(): Promise<ListUserResponse> {
  try {
    const response = await firmezaApiClient.get(`/listUsers`);

    return {
      success: true,
      message: "",
      users: response.data.users, 
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


export async function getUserByWallet(wallet: string): Promise<UserType | null> {
  if (!wallet) {
    throw new Error("Wallet is required.");
  }

  try {
    const response = await firmezaApiClient.post(`/getUserByWallet`, {
      wallet: wallet
    });

    if (response.data && response.data.user) {
      return response.data.user as UserType;
    } else {
      return null;
    }
  } catch (err) {
    console.error("Error fetching user by wallet:", err);
    return null;
  }
}

export async function updateUser(user: UserType): Promise<any> {
  if (!user.name || !user.email || !user.phone || !user.birthdate) {
    throw new Error("All required fields must be provided.");
  }

  try {
    const response = await firmezaApiClient.put(`/updateUser`, {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      birthdate: user.birthdate,
      currentPassword: user.currentPassword,
      newPassword: user.newPassword,
      confirmPassword: user.confirmPassword,
    });
    return { success: true, message: response.data.msg, data: response.data };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return { success: false, message: err.response.data.msg };
    } else {
      return { success: false, message: "An unknown error occurred." };
    }
  }
}
