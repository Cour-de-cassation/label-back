import { acs, getMetadata, getUserByEmail, login, logout, setUserSessionAndReturnRedirectUrl } from './ssoService';

function buildSsoService() {
  return {
    acs,
    getMetadata,
    login,
    logout,
    getUserByEmail,
    setUserSessionAndReturnRedirectUrl,
  };
}

export const ssoService = buildSsoService();
