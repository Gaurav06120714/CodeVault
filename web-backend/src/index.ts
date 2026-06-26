/**
 * Entry point. Load .env (dev only; in Docker the env comes from the
 * container environment) BEFORE importing config so validation sees the vars.
 */
import 'dotenv/config';
import './config/env';
import { startServer } from './server';

startServer();
