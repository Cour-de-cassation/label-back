import { SamlService } from '../../../utils/saml';
import { buildUserRepository, userService } from '../../user';
import { logger, jwtHandler } from '../../../utils';
import every from 'lodash/every';
import includes from 'lodash/includes';
import { idModule, userType } from '@src/core';
import { Request } from 'express';
import {
  SSO_FRONT_SUCCESS_CONNEXION_ANNOTATOR_URL,
  SSO_FRONT_SUCCESS_CONNEXION_ADMIN_SCRUTATOR_URL,
  SSO_FRONT_SUCCESS_CONNEXION_PUBLICATOR_URL,
  SSO_ATTRIBUTE_ROLE,
  SSO_APP_ROLES,
  SSO_APP_NAME,
  SSO_ATTRIBUTE_NAME,
  SSO_ATTRIBUTE_FIRSTNAME,
  SSO_ATTRIBUTE_MAIL,
} from '../../../utils/env';

export interface BindingContext {
  context: string;
  id: string;
}

export interface ParseResponseResult {
  samlContent: string;
  extract: {
    nameID: string;
    sessionIndex: string;
    attributes: Record<string, string[] | string>;
  };
}

function ssoSamlService() {
  return new SamlService();
}

const samlService = ssoSamlService();

export async function getMetadata() {
  return samlService.generateMetadata() as string;
}

export async function login() {
  const loginUrl = await samlService.createLoginRequestUrl();
  return loginUrl;
}

export async function logout() {
  return samlService.createLogoutRequestUrl();
}

export async function acs(req: any) {
  const response = (await samlService.parseResponse(req)) as ParseResponseResult;
  const { extract } = response;

  const userSSO = getUserFromSSO(extract);

  try {
    const userDB = (await getUserByEmail(extract?.nameID)) as userType;
    if (!userDB) {
      await userService.createUser({
        name: userSSO.name,
        email: userSSO.email,
        role: userSSO.role,
      });
      const createdUser = (await getUserByEmail(userSSO.email)) as userType;

      return setUserSessionAndReturnRedirectUrl(req, createdUser, extract?.sessionIndex);
    }
    const hasDiff = compareUser(userSSO, userDB);
    let currentUser = userDB;
    if (hasDiff) {
      currentUser = { ...userSSO, _id: userDB._id };

      logger.log({
        operationName: 'SSO ACS',
        msg: `Difference between SSO and DB user, updating DB user`,
      });

      await userService.updateUser({
        userId: idModule.lib.buildId(userDB._id),
        name: userSSO.name,
        role: userSSO.role,
      });
    }

    return setUserSessionAndReturnRedirectUrl(req, currentUser, extract?.sessionIndex);
  } catch (err: unknown) {
    throw new Error(`Error in acsSso: ${err}`);
  }
}

export async function getUserByEmail(email: string) {
  const userRepository = buildUserRepository();
  return (await userRepository.findByEmail(email)) as userType;
}

export function setUserSessionAndReturnRedirectUrl(req: Request | any, user: userType, sessionIndex: string) {
  const token = jwtHandler.generateToken(user, sessionIndex);

  const roleToUrlMap: Record<string, string> = {
    annotator: SSO_FRONT_SUCCESS_CONNEXION_ANNOTATOR_URL,
    admin: SSO_FRONT_SUCCESS_CONNEXION_ADMIN_SCRUTATOR_URL,
    scrutator: SSO_FRONT_SUCCESS_CONNEXION_ADMIN_SCRUTATOR_URL,
    publicator: SSO_FRONT_SUCCESS_CONNEXION_PUBLICATOR_URL,
  };

  if (!roleToUrlMap[user.role]) {
    throw new Error(`Role doesn't exist in label`);
  }

  // Return URL with token as query parameter
  const redirectUrl = roleToUrlMap[user.role];
  const finalUrl = `${redirectUrl}?token=${token}`;

  return finalUrl;
}

export function getUserFromSSO(extract: ParseResponseResult['extract']): userType {
  const { attributes } = extract;
  const roles = (attributes[`${SSO_ATTRIBUTE_ROLE}`] as string[]).map((item: string) => item.toLowerCase()) as string[];

  const appRoles = SSO_APP_ROLES.toLowerCase().split(',');
  const userRolesInAppRoles = every(roles, (element) => includes(appRoles, element));

  if (!roles.length || !userRolesInAppRoles) {
    const errorMsg = `User ${extract.nameID}, role ${roles} doesn't exist in application ${SSO_APP_NAME}`;
    logger.error({ operationName: 'getUserFromSSO', msg: errorMsg });
    throw new Error(errorMsg);
  }

  return {
    name: `${attributes[`${SSO_ATTRIBUTE_NAME}`] as string} ${attributes[`${SSO_ATTRIBUTE_FIRSTNAME}`] as string}`,
    email: attributes[`${SSO_ATTRIBUTE_MAIL}`] as string,
    role: roles[0] as 'annotator' | 'scrutator' | 'admin' | 'publicator',
    _id: idModule.lib.buildId(),
  };
}

export function compareUser(userSSO: userType | undefined, userDB: userType | undefined): boolean {
  if (!userSSO || !userDB) {
    const errorMsg = `Both objects must be defined.`;
    logger.error({ operationName: 'compareUser', msg: errorMsg });
    throw new Error(errorMsg);
  }
  return userSSO.name !== userDB.name || userSSO.role !== userDB.role;
}
