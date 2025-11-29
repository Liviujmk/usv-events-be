import type { Context as HonoContext } from 'hono';
import type { AuthUser } from './index';

// App environment bindings
export interface Env {
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    user?: AuthUser;
    requestId: string;
    startTime: number;
  };
}

// Typed context
export type Context = HonoContext<Env>;

