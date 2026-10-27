import { fileURLToPath } from 'node:url';
import { buildApp } from './app.js';
import { openDatabase } from './db.js';
import { seedIfEmpty } from './seed.js';
import { createTaskRepository } from './taskRepository.js';

const defaultDbPath = fileURLToPath(new URL('../data/taskflow.db', import.meta.url));

const port = Number(process.env.PORT ?? 3001);
const dbPath = process.env.TASKFLOW_DB_PATH ?? defaultDbPath;
const actor = process.env.TASKFLOW_ACTOR ?? 'demo-operator';
const shouldSeed = (process.env.TASKFLOW_SEED ?? 'true') !== 'false';

const db = openDatabase(dbPath);
const repo = createTaskRepository(db);
if (shouldSeed) seedIfEmpty(repo);

const app = buildApp({ repo, actor, logger: true });

const shutdown = async () => {
  await app.close();
  db.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await app.listen({ port, host: '127.0.0.1' });
app.log.info(`TaskFlow api on http://127.0.0.1:${port} (db: ${dbPath}, actor: ${actor})`);
