/**
 * git-service entry. Loads .env (dev) before config validation, starts the API
 * server. The sync scheduler is registered here once the jobs module lands.
 */
import 'dotenv/config';
import './config/env';
import { startServer } from './server';

startServer();
