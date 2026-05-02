import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const fmzCn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
