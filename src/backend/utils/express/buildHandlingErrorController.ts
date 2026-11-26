import { expressRequestHandlerType } from './express';
import { HttpError } from '../errors';

export { buildHandlingErrorController };

const buildHandlingErrorController =
  (controller: expressRequestHandlerType): expressRequestHandlerType =>
  async (req, res, next) => {
    try {
      const response = await controller(req, res, next);
      res.send(response);
    } catch (error) {
      res.status(error instanceof HttpError ? error.statusCode : 500);
      next(error);
    }
  };
