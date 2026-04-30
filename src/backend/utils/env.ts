import dotenv from 'dotenv';

if (!process.env.ENV) dotenv.config();

export const isTest = process.env.NODE_ENV?.toUpperCase() === 'TEST';

if (!isTest && process.env.ENV == null) throw new Error('process.env.ENV is missing');
if (!isTest && process.env.LABEL_DB_URL == null) throw new Error('process.env.LABEL_DB_URL is missing');
if (!isTest && process.env.LABEL_DB_NAME == null) throw new Error('process.env.LABEL_DB_NAME is missing');
if (!isTest && process.env.LABEL_CLIENT_URL == null) throw new Error('process.env.LABEL_CLIENT_URL is missing');
if (!isTest && process.env.LABEL_API_PORT == null) throw new Error('process.env.LABEL_API_PORT is missing');
if (!isTest && process.env.DBSDER_API_URL == null) throw new Error('process.env.DBSDER_API_URL is missing');
if (!isTest && process.env.DBSDER_API_KEY == null) throw new Error('process.env.DBSDER_API_KEY is missing');
if (!isTest && process.env.NLP_API_URL == null) throw new Error('process.env.NLP_API_URL is missing');
if (!isTest && process.env.JWT_SECRET == null) throw new Error('process.env.JWT_SECRET is missing');
if (!isTest && process.env.SSO_SP_ENTITY_ID == null) throw new Error('process.env.SSO_SP_ENTITY_ID is missing');
if (!isTest && process.env.SSO_SP_ASSERTION_CONSUMER_SERVICE_LOCATION == null)
  throw new Error('process.env.SSO_SP_ASSERTION_CONSUMER_SERVICE_LOCATION is missing');
if (!isTest && process.env.SSO_IDP_METADATA == null) throw new Error('process.env.SSO_IDP_METADATA is missing');
if (!isTest && process.env.SSO_IDP_SINGLE_SIGN_ON_SERVICE_LOCATION == null)
  throw new Error('process.env.SSO_IDP_SINGLE_SIGN_ON_SERVICE_LOCATION is missing');
if (!isTest && process.env.SSO_IDP_SINGLE_LOGOUT_SERVICE_LOCATION == null)
  throw new Error('process.env.SSO_IDP_SINGLE_LOGOUT_SERVICE_LOCATION is missing');
if (!isTest && process.env.SSO_CERTIFICAT == null) throw new Error('process.env.SSO_CERTIFICAT is missing');
if (!isTest && process.env.SSO_SP_PRIVATE_KEY == null) throw new Error('process.env.SSO_SP_PRIVATE_KEY is missing');
if (!isTest && process.env.SSO_FRONT_SUCCESS_CONNEXION_ANNOTATOR_URL == null)
  throw new Error('process.env.SSO_FRONT_SUCCESS_CONNEXION_ANNOTATOR_URL is missing');
if (!isTest && process.env.SSO_FRONT_SUCCESS_CONNEXION_ADMIN_SCRUTATOR_URL == null)
  throw new Error('process.env.SSO_FRONT_SUCCESS_CONNEXION_ADMIN_SCRUTATOR_URL is missing');
if (!isTest && process.env.SSO_FRONT_SUCCESS_CONNEXION_PUBLICATOR_URL == null)
  throw new Error('process.env.SSO_FRONT_SUCCESS_CONNEXION_PUBLICATOR_URL is missing');
if (!isTest && process.env.SSO_ATTRIBUTE_NAME == null) throw new Error('process.env.SSO_ATTRIBUTE_NAME is missing');
if (!isTest && process.env.SSO_ATTRIBUTE_FIRSTNAME == null)
  throw new Error('process.env.SSO_ATTRIBUTE_FIRSTNAME is missing');
if (!isTest && process.env.SSO_ATTRIBUTE_MAIL == null) throw new Error('process.env.SSO_ATTRIBUTE_MAIL is missing');
if (!isTest && process.env.SSO_ATTRIBUTE_ROLE == null) throw new Error('process.env.SSO_ATTRIBUTE_ROLE is missing');
if (!isTest && process.env.SSO_APP_NAME == null) throw new Error('process.env.SSO_APP_NAME is missing');
if (!isTest && process.env.SSO_APP_ROLES == null) throw new Error('process.env.SSO_APP_ROLES is missing');

export const ENV = process.env.ENV as string;
export const LABEL_DB_URL = process.env.LABEL_DB_URL as string;
export const LABEL_DB_NAME = process.env.LABEL_DB_NAME as string;
export const LABEL_CLIENT_URL = process.env.LABEL_CLIENT_URL as string;
export const LABEL_API_PORT = process.env.LABEL_API_PORT as string;
export const DBSDER_API_URL = process.env.DBSDER_API_URL as string;
export const DBSDER_API_KEY = process.env.DBSDER_API_KEY as string;
export const NLP_API_URL = process.env.NLP_API_URL as string;
export const JWT_SECRET = process.env.JWT_SECRET as string;
export const JWT_EXPIRATION = process.env.JWT_EXPIRATION as string;
export const SSO_SP_ENTITY_ID = process.env.SSO_SP_ENTITY_ID as string;
export const SSO_SP_ASSERTION_CONSUMER_SERVICE_LOCATION = process.env
  .SSO_SP_ASSERTION_CONSUMER_SERVICE_LOCATION as string;
export const SSO_IDP_METADATA = process.env.SSO_IDP_METADATA as string;
export const SSO_IDP_SINGLE_SIGN_ON_SERVICE_LOCATION = process.env.SSO_IDP_SINGLE_SIGN_ON_SERVICE_LOCATION as string;
export const SSO_IDP_SINGLE_LOGOUT_SERVICE_LOCATION = process.env.SSO_IDP_SINGLE_LOGOUT_SERVICE_LOCATION as string;
export const SSO_CERTIFICAT = process.env.SSO_CERTIFICAT as string;
export const SSO_SP_PRIVATE_KEY = process.env.SSO_SP_PRIVATE_KEY as string;
export const SSO_FRONT_SUCCESS_CONNEXION_ANNOTATOR_URL = process.env
  .SSO_FRONT_SUCCESS_CONNEXION_ANNOTATOR_URL as string;
export const SSO_FRONT_SUCCESS_CONNEXION_ADMIN_SCRUTATOR_URL = process.env
  .SSO_FRONT_SUCCESS_CONNEXION_ADMIN_SCRUTATOR_URL as string;
export const SSO_FRONT_SUCCESS_CONNEXION_PUBLICATOR_URL = process.env
  .SSO_FRONT_SUCCESS_CONNEXION_PUBLICATOR_URL as string;
export const SSO_ATTRIBUTE_NAME = process.env.SSO_ATTRIBUTE_NAME as string;
export const SSO_ATTRIBUTE_FIRSTNAME = process.env.SSO_ATTRIBUTE_FIRSTNAME as string;
export const SSO_ATTRIBUTE_MAIL = process.env.SSO_ATTRIBUTE_MAIL as string;
export const SSO_ATTRIBUTE_ROLE = process.env.SSO_ATTRIBUTE_ROLE as string;
export const SSO_APP_NAME = process.env.SSO_APP_NAME as string;
export const SSO_APP_ROLES = process.env.SSO_APP_ROLES as string;
