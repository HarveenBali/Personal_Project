import SecureLS from 'secure-ls';

let secureLs: SecureLS | undefined;

function getSecureLs(): SecureLS {
  if (typeof window === 'undefined') {
    throw new Error('Secure storage is only available in the browser.');
  }

  secureLs ??= new SecureLS({ encodingType: 'aes' });
  return secureLs;
}

export function getSecureItem<T>(key: string): T | null {
  return getSecureLs().get(key) as T | null;
}

export function setSecureItem(key: string, value: unknown): void {
  getSecureLs().set(key, value);
}

export function removeSecureItem(key: string): void {
  getSecureLs().remove(key);
}
