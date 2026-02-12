import { AsyncLocalStorage } from "async_hooks";

export interface Context {
  tenantId?: string;
  userId?: string;
}

const context = new AsyncLocalStorage<Context>();

export default context;
