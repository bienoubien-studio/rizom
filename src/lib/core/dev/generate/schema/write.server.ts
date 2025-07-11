import { spawnSync } from 'node:child_process';
import fs from 'fs';
import cache from '../../cache/index.js';
import { logger } from '$lib/core/logger/index.server.js';

const write = (schema: string) => {
	const cachedSchema = cache.get('schema');

	if (cachedSchema && cachedSchema === schema) {
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
			logger.info('[✓] Schema: generated at src/lib/server/schema.ts');
			console.log('============================================================');
			console.log('\n ⚡︎ npx drizzle-kit push \n');
			spawnSync('npx', ['drizzle-kit', 'push'], { stdio: 'inherit' });
			console.log('\n============================================================');
		}
	});
};

export default write;

// type Args = { drizzleContent: string[]; zodContent: string[] };
