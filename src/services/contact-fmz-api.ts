import axios from 'axios';
import { firmezaApiClient } from './firmeza-api-client';

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
    console.log("response==> ",response)
    return { success: true, message: response.data.msg }; 
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return { success: false, message: err.response.data.msg }; 
    } else {
      return { success: false, message: "An unknown error occurred." };
    }
  }
}

export async function listContactUser(): Promise<ListContactUserResponse> {
  try {
    const response = await firmezaApiClient.get(`/listContactUsers`);

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