import pino from 'pino';
import { env, isDev } from '../config/env';

// Redaction — never let credentials or platform tokens reach the logs.
// Covers request/response headers (auth + cookies) and common secret field names
// wherever they appear in a logged object.
export const redactOptions = {
  paths: [
    'req.headers.authorization',
    'req.headers.cookie',
    'res.headers["set-cookie"]',
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'sessionToken',
    'tokenCipher',
    'tokenIv',
    '*.password',
    '*.token',
    '*.accessToken',
    '*.refreshToken',
    '*.sessionToken',
    '*.tokenCipher',
  ],
  censor: '[REDACTED]',
};

const logger = pino({
  level: env.LOG_LEVEL,
  redact: redactOptions,
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      }
    : undefined,
});

export default logger;
