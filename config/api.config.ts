export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ?? '';

export const isDemoMode = API_BASE_URL.length === 0;
