#!/usr/bin/env node
import inquirer from 'inquirer';
import { red, green, cyan } from 'kolorist';
import { mkdirSync, writeFileSync, cpSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
	console.log(cyan('🔥 Create Hono Starter'));

	// Get command-line arguments
	const args = process.argv.slice(2);
	const rawName = args.find((a) => !a.startsWith('--'));

	let projectName = rawName;
	let packageManager;

	if (!projectName) {
		// Ask interactively if no name passed
		const answers = await inquirer.prompt([
			{
				name: 'projectName',
				type: 'input',
				message: 'Project name:',
				default: 'my-hono-app',
			},
			{
				name: 'packageManager',
				type: 'list',
				message: 'Choose your package manager (for later use):',
				choices: ['npm', 'pnpm', 'bun'],
				default: 'npm',
			},
		]);

		projectName = answers.projectName;
		packageManager = answers.packageManager;
	} else {
		// If name is passed, only ask for package manager
		const answers = await inquirer.prompt([
			{
				name: 'packageManager',
				type: 'list',
				message: 'Choose your package manager (for later use):',
				choices: ['npm', 'pnpm', 'bun'],
				default: 'npm',
			},
		]);

		packageManager = answers.packageManager;
	}

	const projectPath = join(process.cwd(), projectName);

	// Create project folder
	mkdirSync(projectPath, { recursive: true });

	// Copy template into new folder
	const templatePath = join(__dirname, 'template');
	cpSync(templatePath, projectPath, { recursive: true });

	// Handle package.json
	const pkgPath = join(projectPath, 'package.json');
	const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
	pkg.name = projectName;
	writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

	console.log(green(`✅ Project ${projectName} created.`));
}

main().catch((err) => {
	console.error(red('❌ Error:'), err);
	process.exit(1);
});