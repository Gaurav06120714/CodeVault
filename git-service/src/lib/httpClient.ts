import axios from 'axios';

/** Generic axios instance for platform calls (GitHub uses its own — lib/github.ts). */
export const httpClient = axios.create({
  timeout: 20_000,
  headers: { 'User-Agent': 'CodeVault' },
});
