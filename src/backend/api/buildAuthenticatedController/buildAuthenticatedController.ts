import { idModule, userModule, userType } from '@src/core';
import { logger } from '../../utils';

export { buildAuthenticatedController };

function buildAuthenticatedController<inT, outT>({
  permissions,
  controllerWithUser,
}: {
  permissions: Array<userType['role']>;
  controllerWithUser: (user: userType, req: { args: inT; headers: any; path?: string }) => Promise<outT>;
}): (req: { args: inT; headers: any; user?: any; path?: string }) => Promise<outT> {
  return async (req: {
    args: inT;
    headers: any;
    user?: {
      _id: string;
      name: string;
      role: string;
      email: string;
      sessionIndex: string;
    };
    path?: string;
  }) => {
    const currentUser = req.user ?? null;
    if (!currentUser) {
      const error = new Error(`user session has expired or is invalid`);
      logger.error({
        operationName: 'Authenticated Controller',
        msg: `No authenticated user found for ${req.path}`,
      });
      throw error;
    }

    logger.log({
      operationName: 'Authenticated Controller',
      msg: `Authenticated request for ${req.path} by ${currentUser.email}`,
    });

    const resolvedUser = {
      _id: idModule.lib.buildId(currentUser._id) as userType['_id'],
      name: currentUser.name,
      role: currentUser.role as 'admin' | 'annotator' | 'publicator' | 'scrutator',
      email: currentUser.email,
    };

    userModule.lib.assertPermissions(resolvedUser, permissions);
    return controllerWithUser(resolvedUser, req);
  };
}
