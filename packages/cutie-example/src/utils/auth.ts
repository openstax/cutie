import { TOKEN_URL } from './config';

export interface UserInfo {
  exp?: number;
  [key: string]: unknown;
}

const search = location.search;
const params = new URLSearchParams(search);
const searchToken = params.get('token');

// If the token is present in the URL, store it in localStorage
if (searchToken) {
  localStorage.setItem('launch_token', searchToken);
  localStorage.removeItem('explicit_logout');

  // Immediately redirect to remove the token from the url
  params.delete('token');
  const redirectUrl = new URL(location.href);
  redirectUrl.search = params.toString();
  window.location.replace(redirectUrl.toString());
}

const explicitLogout = localStorage.getItem('explicit_logout') === 'true';
export const token: string | null = localStorage.getItem('launch_token') ?? null;
export const userInfo: UserInfo | null = decodeToken();

export const shouldRenewToken = (): boolean => {
  if (!userInfo?.exp) return true;
  const currentTime = Date.now() / 1000;
  const timeLeft = userInfo.exp - currentTime;
  return timeLeft < 60 * 60 * 5; // 5 hours
};

export const redirectToAuth = (forceRelogin: boolean = explicitLogout): void => {
  const redirectUrl = new URL(TOKEN_URL);
  redirectUrl.searchParams.set('r', location.href);

  if (forceRelogin) {
    redirectUrl.searchParams.set('force_relogin', 'true');
  }

  window.location.href = redirectUrl.toString();
  document.body.style.display = 'none';
};

function decodeToken(): UserInfo | null {
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    const decodedPayload = atob(payload);
    return JSON.parse(decodedPayload) as UserInfo;
  } catch {
    return null;
  }
}
