import { spawnSync } from 'node:child_process';
import fs from 'fs';
import { taskLogger } from 'rizom/util/logger/index.js';
import cache from '../cache/index.js';

const write = (schema: string) => {
	const cachedSchema = cache.get('schema');

	if (cachedSchema && cachedSchema === schema) {
		// taskLogger.info('-  schema   :: No change detected');
		return;
	} else {
		cache.set('schema', schema);
	}

	if (!fs.existsSync('./src/lib/server')) {
		fs.mkdirSync('./src/lib/server');
	}

	fs.writeFile('./src/lib/server/schema.ts', schema, (err) => {
		if (err) {
			console.error(err);
		} else {
			taskLogger.done('Schema: generated at src/lib/server/schema.ts');
			spawnSync('npx', ['drizzle-kit', 'push'], { stdio: 'inherit' });
		}
	});
};

export default write;

// type Args = { drizzleContent: string[]; zodContent: string[] };
