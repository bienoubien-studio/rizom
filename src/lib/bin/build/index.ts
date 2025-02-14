#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { program } from 'commander';
import { copyFileSync, cpSync, existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'fs';
import { expressServer } from './templates.js';
import { taskLogger } from 'rizom/utils/logger/index.js';

program.version('0.1').description('CMS utilities');

program
	.description('Build CMS')
	.option('-d, --with-database', 'Include database', false)
	.action((args) => {
		// Delete app folder if it exists
		if (existsSync('./app')) {
			rmSync('./app', { recursive: true, force: true });
		}
		// Build
		spawnSync('./node_modules/.bin/vite', ['build'], { stdio: 'inherit' });
		console.log('');
		// Create app directory
		mkdirSync('./app', { recursive: true });
		// Move build folder
		renameSync('./build', './app/build');
		taskLogger.done('/app folder created');
		// Copy package.json
		copyFileSync('./package.json', './app/package.json');
		taskLogger.done('package.json copied');
		// Copy db folder if flag is set
		if (args.withDatabase) {
			cpSync('./db', './app/db', { recursive: true });
			taskLogger.done('database copied');
		}
		writeFileSync('./app/index.js', expressServer);
		taskLogger.done('polka server created at app/index.js');
		console.log('');
		taskLogger.info('Next steps :');
		taskLogger.info('create a /app/.env file with ORIGIN HOST and PORT variables');
		taskLogger.info('cd ./app');
		taskLogger.info('pnpm install --prod');
		taskLogger.info('node --env-file=.env index.js');
	});

program.parse(process.argv);
