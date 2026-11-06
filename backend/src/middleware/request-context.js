import { AsyncLocalStorage } from 'node:async_hooks';

const requestContext = new AsyncLocalStorage();

export function withRequestContext(req, res, next) {
  requestContext.run({ ipAddress: req.ip || null }, next);
}

export function getRequestIpAddress() {
  return requestContext.getStore()?.ipAddress ?? null;
}
