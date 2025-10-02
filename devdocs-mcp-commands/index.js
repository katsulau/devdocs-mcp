#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Language messages
const messages = {
  en: {
    initializingCursor: '🚀 Initializing Cursor slash commands...',
    initializingClaude: '🚀 Initializing Claude slash commands...',
    successCursor: '\n🎉 Cursor slash commands initialized successfully!',
    successClaude: '\n🎉 Claude slash commands initialized successfully!',
    nextSteps: '\nNext steps:',
    step1: '1. Go to http://localhost:9292 and search for the language you want',
    step1Note1: '   - If an "enabled" link appears, click it to download the documentation',
    step1Note2: '   - If no "enabled" link appears, the documentation is already downloaded',
    step2: '2. After enabling, you can use slash commands to search. For example:',
    example1: '   /devdocs/postgresql-17 How to optimize database performance?',
    example2: '   /devdocs/openjdk-21 How to implement asynchronous processing?',
    example3: '   /devdocs/python-3.12 How do list comprehensions work?',
    step3: '3. If slash commands are not available, you can add them. See README section 4.5-setup-slash-commands for details:',
    readmeLink: '   https://github.com/katsulau/devdocs-mcp?tab=readme-ov-file#45-setup-slash-commands-recommended',
    errorCursor: '❌ Error initializing Cursor commands:',
    errorClaude: '❌ Error initializing Claude commands:',
    invalidPreset: 'Invalid preset. Use "cursor" or "claude".'
  },
  ja: {
    initializingCursor: '🚀 Cursorスラッシュコマンドを初期化中...',
    initializingClaude: '🚀 Claudeスラッシュコマンドを初期化中...',
    successCursor: '\n🎉 Cursorスラッシュコマンドの初期化が完了しました！',
    successClaude: '\n🎉 Claudeスラッシュコマンドの初期化が完了しました！',
    nextSteps: '\n次のステップ:',
    step1: '1. http://localhost:9292 にアクセスして、必要な言語を検索してください',
    step1Note1: '   - 「enabled」リンクが表示された場合は、クリックしてドキュメントをダウンロードしてください',
    step1Note2: '   - 「enabled」リンクが表示されない場合は、ドキュメントは既にダウンロード済みです',
    step2: '2. 有効化後、スラッシュコマンドで検索できます。例:',
    example1: '   /devdocs/postgresql-17 データベースのパフォーマンスを最適化するには？',
    example2: '   /devdocs/openjdk-21 非同期処理を実装するには？',
    example3: '   /devdocs/python-3.12 型推論はどうやってできる？',
    step3: '3. スラッシュコマンドが利用できない場合は、追加できます。詳細はREADMEの4.5-setup-slash-commandsセクションを参照してください:',
    readmeLink: '   https://github.com/katsulau/devdocs-mcp?tab=readme-ov-file#45-setup-slash-commands-recommended',
    errorCursor: '❌ Cursorコマンドの初期化エラー:',
    errorClaude: '❌ Claudeコマンドの初期化エラー:',
    invalidPreset: '無効なプリセットです。"cursor"または"claude"を使用してください。'
  }
};

const program = new Command();

program
  .name('devdocs-mcp-commands')
  .description('Initialize DevDocs MCP slash commands for Cursor and Claude')
  .version('1.0.0')
  .option('--lang <language>', 'Language for messages (en, ja)', 'en');

program
  .command('cursor')
  .description('Initialize Cursor slash commands')
  .action(async (options) => {
    const lang = program.opts().lang || 'en';
    await initCursorCommands(lang);
  });

program
  .command('claude')
  .description('Initialize Claude slash commands')
  .action(async (options) => {
    const lang = program.opts().lang || 'en';
    await initClaudeCommands(lang);
  });

// Legacy support for --preset flag
program
  .option('--preset <preset>', 'Preset to use (cursor or claude)')
  .action(async (options) => {
    const lang = program.opts().lang || 'en';
    if (options.preset === 'cursor') {
      await initCursorCommands(lang);
    } else if (options.preset === 'claude') {
      await initClaudeCommands(lang);
    } else {
      console.error(chalk.red(messages[lang].invalidPreset));
      process.exit(1);
    }
  });

async function initCursorCommands(lang = 'en') {
  console.log(chalk.blue(messages[lang].initializingCursor));
  
  const cursorCommandsDir = path.join(process.cwd(), '.cursor', 'commands', 'devdocs');
  
  try {
    // Create directory structure
    await fs.ensureDir(cursorCommandsDir);
    
    // Copy Cursor-specific commands
    const cursorCommands = [
      {
        name: 'search.md',
        content: `# DevDocs Search

* Use view_available_docs to return a list of target languages based on user input keywords.
* Present links in a clickable format based on slugs.
* Guide users to open localhost links and press "Enable" for the language they want to use.
`
      },
      {
        name: 'typescript.md',
        content: `# TypeScript Documentation

* Use search_specific_docs with slug="typescript" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'javascript.md',
        content: `# JavaScript Documentation

* Use search_specific_docs with slug="javascript" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'python-3.12.md',
        content: `# Python 3.12 Documentation

* Use search_specific_docs with slug="python~3.12" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'openjdk-21.md',
        content: `# OpenJDK 21 Documentation

* Use search_specific_docs with slug="openjdk~21" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'postgresql-17.md',
        content: `# PostgreSQL 17 Documentation

* Use search_specific_docs with slug="postgresql~17" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'mysql.md',
        content: `# MySQL Documentation

* Use search_specific_docs with slug="mysql" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'sqlite.md',
        content: `# SQLite Documentation

* Use search_specific_docs with slug="sqlite" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'redis.md',
        content: `# Redis Documentation

* Use search_specific_docs with slug="redis" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'mongodb.md',
        content: `# MongoDB Documentation

* Use search_specific_docs with slug="mongodb" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'git.md',
        content: `# Git Documentation

* Use search_specific_docs with slug="git" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'docker-19.md',
        content: `# Docker 19 Documentation

* Use search_specific_docs with slug="docker~19" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'kubernetes-1.28.md',
        content: `# Kubernetes 1.28 Documentation

* Use search_specific_docs with slug="kubernetes~1.28" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'terraform.md',
        content: `# Terraform Documentation

* Use search_specific_docs with slug="terraform" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'ansible-2.11.md',
        content: `# Ansible 2.11 Documentation

* Use search_specific_docs with slug="ansible~2.11" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'django-5.2.md',
        content: `# Django 5.2 Documentation

* Use search_specific_docs with slug="django~5.2" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'flask.md',
        content: `# Flask Documentation

* Use search_specific_docs with slug="flask" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'fastapi.md',
        content: `# FastAPI Documentation

* Use search_specific_docs with slug="fastapi" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'spring-boot.md',
        content: `# Spring Boot Documentation

* Use search_specific_docs with slug="spring_boot" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'php.md',
        content: `# PHP Documentation

* Use search_specific_docs with slug="php" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'laravel-11.md',
        content: `# Laravel 11 Documentation

* Use search_specific_docs with slug="laravel~11" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'ruby-3.4.md',
        content: `# Ruby 3.4 Documentation

* Use search_specific_docs with slug="ruby~3.4" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'rails-8.0.md',
        content: `# Ruby on Rails 8.0 Documentation

* Use search_specific_docs with slug="rails~8.0" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'go.md',
        content: `# Go Documentation

* Use search_specific_docs with slug="go" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'rust.md',
        content: `# Rust Documentation

* Use search_specific_docs with slug="rust" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'cpp.md',
        content: `# C++ Documentation

* Use search_specific_docs with slug="cpp" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'csharp.md',
        content: `# C# Documentation

* Use search_specific_docs with slug="csharp" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'kotlin-1.9.md',
        content: `# Kotlin 1.9 Documentation

* Use search_specific_docs with slug="kotlin~1.9" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'swift.md',
        content: `# Swift Documentation

* Use search_specific_docs with slug="swift" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'scala-3.2.md',
        content: `# Scala 3.2 Documentation

* Use search_specific_docs with slug="scala~3.2" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'express-4.md',
        content: `# Express 4 Documentation

* Use search_specific_docs with slug="express~4" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'koa-2.md',
        content: `# Koa 2 Documentation

* Use search_specific_docs with slug="koa~2" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
    ];
    
    for (const command of cursorCommands) {
      const filePath = path.join(cursorCommandsDir, command.name);
      await fs.writeFile(filePath, command.content);
      console.log(chalk.green(`✅ Created: ${command.name}`));
    }
    
    console.log(chalk.green(messages[lang].successCursor));
    console.log(chalk.yellow(messages[lang].nextSteps));
    console.log(messages[lang].step1);
    console.log(messages[lang].step1Note1);
    console.log(messages[lang].step1Note2);
    console.log(messages[lang].step2);
    console.log(messages[lang].example1);
    console.log(messages[lang].example2);
    console.log(messages[lang].example3);
    console.log(messages[lang].step3);
    console.log(messages[lang].readmeLink);
    
  } catch (error) {
    console.error(chalk.red(messages[lang].errorCursor), error.message);
    process.exit(1);
  }
}

async function initClaudeCommands(lang = 'en') {
  console.log(chalk.blue(messages[lang].initializingClaude));
  
  const claudeCommandsDir = path.join(process.cwd(), '.claude', 'commands', 'devdocs');
  
  try {
    // Create directory structure
    await fs.ensureDir(claudeCommandsDir);
    
    // Copy Claude-specific commands
    const claudeCommands = [
      {
        name: 'search.md',
        content: `# DevDocs Search

* Use view_available_docs to return a list of target languages based on user input keywords.
* Present links in a clickable format based on slugs.
* Guide users to open localhost links and press "Enable" for the language they want to use.
`
      },
      {
        name: 'typescript.md',
        content: `# TypeScript Documentation

* Use search_specific_docs with slug="typescript" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'javascript.md',
        content: `# JavaScript Documentation

* Use search_specific_docs with slug="javascript" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'python-3.12.md',
        content: `# Python 3.12 Documentation

* Use search_specific_docs with slug="python~3.12" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'openjdk-21.md',
        content: `# OpenJDK 21 Documentation

* Use search_specific_docs with slug="openjdk~21" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'postgresql-17.md',
        content: `# PostgreSQL 17 Documentation

* Use search_specific_docs with slug="postgresql~17" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'mysql.md',
        content: `# MySQL Documentation

* Use search_specific_docs with slug="mysql" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'sqlite.md',
        content: `# SQLite Documentation

* Use search_specific_docs with slug="sqlite" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'redis.md',
        content: `# Redis Documentation

* Use search_specific_docs with slug="redis" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'mongodb.md',
        content: `# MongoDB Documentation

* Use search_specific_docs with slug="mongodb" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'git.md',
        content: `# Git Documentation

* Use search_specific_docs with slug="git" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'docker-19.md',
        content: `# Docker 19 Documentation

* Use search_specific_docs with slug="docker~19" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'kubernetes-1.28.md',
        content: `# Kubernetes 1.28 Documentation

* Use search_specific_docs with slug="kubernetes~1.28" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'terraform.md',
        content: `# Terraform Documentation

* Use search_specific_docs with slug="terraform" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'ansible-2.11.md',
        content: `# Ansible 2.11 Documentation

* Use search_specific_docs with slug="ansible~2.11" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'django-5.2.md',
        content: `# Django 5.2 Documentation

* Use search_specific_docs with slug="django~5.2" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'flask.md',
        content: `# Flask Documentation

* Use search_specific_docs with slug="flask" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'fastapi.md',
        content: `# FastAPI Documentation

* Use search_specific_docs with slug="fastapi" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'spring-boot.md',
        content: `# Spring Boot Documentation

* Use search_specific_docs with slug="spring_boot" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'php.md',
        content: `# PHP Documentation

* Use search_specific_docs with slug="php" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'laravel-11.md',
        content: `# Laravel 11 Documentation

* Use search_specific_docs with slug="laravel~11" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'ruby-3.4.md',
        content: `# Ruby 3.4 Documentation

* Use search_specific_docs with slug="ruby~3.4" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'rails-8.0.md',
        content: `# Ruby on Rails 8.0 Documentation

* Use search_specific_docs with slug="rails~8.0" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'go.md',
        content: `# Go Documentation

* Use search_specific_docs with slug="go" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'rust.md',
        content: `# Rust Documentation

* Use search_specific_docs with slug="rust" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'cpp.md',
        content: `# C++ Documentation

* Use search_specific_docs with slug="cpp" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'csharp.md',
        content: `# C# Documentation

* Use search_specific_docs with slug="csharp" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'kotlin-1.9.md',
        content: `# Kotlin 1.9 Documentation

* Use search_specific_docs with slug="kotlin~1.9" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'swift.md',
        content: `# Swift Documentation

* Use search_specific_docs with slug="swift" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'scala-3.2.md',
        content: `# Scala 3.2 Documentation

* Use search_specific_docs with slug="scala~3.2" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'express-4.md',
        content: `# Express 4 Documentation

* Use search_specific_docs with slug="express~4" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
      {
        name: 'koa-2.md',
        content: `# Koa 2 Documentation

* Use search_specific_docs with slug="koa~2" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
      },
    ];
    
    for (const command of claudeCommands) {
      const filePath = path.join(claudeCommandsDir, command.name);
      await fs.writeFile(filePath, command.content);
      console.log(chalk.green(`✅ Created: ${command.name}`));
    }
    
    console.log(chalk.green(messages[lang].successClaude));
    console.log(chalk.yellow(messages[lang].nextSteps));
    console.log(messages[lang].step1);
    console.log(messages[lang].step1Note1);
    console.log(messages[lang].step1Note2);
    console.log(messages[lang].step2);
    console.log(messages[lang].example1);
    console.log(messages[lang].example2);
    console.log(messages[lang].example3);
    console.log(messages[lang].step3);
    console.log(messages[lang].readmeLink);
  } catch (error) {
    console.error(chalk.red(messages[lang].errorClaude), error.message);
    process.exit(1);
  }
}

// Handle case where no command is provided
if (process.argv.length === 2) {
  program.help();
}

program.parse();
