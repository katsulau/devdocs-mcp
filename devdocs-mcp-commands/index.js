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
    step1: '1. After MCP server setup is complete, you can use slash commands to search. For example:',
    example1: '   /devdocs/postgresql-17 How to optimize database performance?',
    example2: '   /devdocs/openjdk-21 How to implement asynchronous processing?',
    example3: '   /devdocs/python-3.12 How do list comprehensions work?',
    step2: '2. If the language you want to search is not available in slash commands, you can add them. See README section 4.5-setup-slash-commands for details:',
    readmeLink: '   https://github.com/katsulau/devdocs-mcp?tab=readme-ov-file#45-setup-slash-commands-recommended',
    errorCursor: '❌ Error initializing Cursor commands:',
    errorClaude: '❌ Error initializing Claude commands:',
    invalidPreset: 'Invalid preset. Use "cursor" or "claude".',
    // Markdown templates
    searchTemplate: `# DevDocs Search

* Use view_available_docs to return a list of target languages based on user input keywords.
* Present links in a clickable format based on slugs.
* If the language you want to search is not available in slash commands, you can add them. See README section 4.5-setup-slash-commands for details:
  https://github.com/katsulau/devdocs-mcp?tab=readme-ov-file#45-setup-slash-commands-recommended
`,
    docTemplate: (title, slug) => `# ${title} Documentation

* Use search_specific_docs with slug="${slug}" to search and respond based on the content.

* Present implementation methods with clickable links to referenced sections.
`
  },
  ja: {
    initializingCursor: '🚀 Cursorスラッシュコマンドを初期化中...',
    initializingClaude: '🚀 Claudeスラッシュコマンドを初期化中...',
    successCursor: '\n🎉 Cursorスラッシュコマンドの初期化が完了しました！',
    successClaude: '\n🎉 Claudeスラッシュコマンドの初期化が完了しました！',
    nextSteps: '\n次のステップ:',
    step1: '1. MCPサーバーのsetupが完了後、スラッシュコマンドで検索できます。例:',
    example1: '   /devdocs/postgresql-17 データベースのパフォーマンスを最適化するには？',
    example2: '   /devdocs/openjdk-21 非同期処理を実装するには？',
    example3: '   /devdocs/python-3.12 型推論はどうやってできる？',
    step2: '2. 検索したい言語がスラッシュコマンドにない場合は、追加できます。詳細はREADMEの4.5-setup-slash-commandsセクションを参照してください:',
    readmeLink: '   https://github.com/katsulau/devdocs-mcp?tab=readme-ov-file#45-setup-slash-commands-recommended',
    errorCursor: '❌ Cursorコマンドの初期化エラー:',
    errorClaude: '❌ Claudeコマンドの初期化エラー:',
    invalidPreset: '無効なプリセットです。"cursor"または"claude"を使用してください。',
    // Markdown templates
    searchTemplate: `# DevDocs 検索

* ユーザーの入力キーワードに基づいて対象言語のリストを返すためにview_available_docsを使用してください。
* スラッグに基づいてクリック可能な形式でリンクを提示してください。
* 検索したい言語がスラッシュコマンドにない場合は、追加できます。詳細はREADMEの4.5-setup-slash-commandsセクションを参照してください:
  https://github.com/katsulau/devdocs-mcp?tab=readme-ov-file#45-setup-slash-commands-recommended
`,
    docTemplate: (title, slug) => `# ${title} ドキュメント

* コンテンツに基づいて検索し、レスポンスするためにsearch_specific_docs with slug="${slug}"を使用してください。

* 参照セクションへのクリック可能なリンクで実装方法を提示してください。
`
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
        content: messages[lang].searchTemplate
      },
      {
        name: 'typescript.md',
        content: messages[lang].docTemplate('TypeScript', 'typescript')
      },
      {
        name: 'javascript.md',
        content: messages[lang].docTemplate('JavaScript', 'javascript')
      },
      {
        name: 'python-3.12.md',
        content: messages[lang].docTemplate('Python 3.12', 'python~3.12')
      },
      {
        name: 'openjdk-21.md',
        content: messages[lang].docTemplate('OpenJDK 21', 'openjdk~21')
      },
      {
        name: 'postgresql-17.md',
        content: messages[lang].docTemplate('PostgreSQL 17', 'postgresql~17')
      },
      {
        name: 'mysql.md',
        content: messages[lang].docTemplate('MySQL', 'mysql')
      },
      {
        name: 'sqlite.md',
        content: messages[lang].docTemplate('SQLite', 'sqlite')
      },
      {
        name: 'redis.md',
        content: messages[lang].docTemplate('Redis', 'redis')
      },
      {
        name: 'mongodb.md',
        content: messages[lang].docTemplate('MongoDB', 'mongodb')
      },
      {
        name: 'git.md',
        content: messages[lang].docTemplate('Git', 'git')
      },
      {
        name: 'docker-19.md',
        content: messages[lang].docTemplate('Docker 19', 'docker~19')
      },
      {
        name: 'kubernetes-1.28.md',
        content: messages[lang].docTemplate('Kubernetes 1.28', 'kubernetes~1.28')
      },
      {
        name: 'terraform.md',
        content: messages[lang].docTemplate('Terraform', 'terraform')
      },
      {
        name: 'ansible-2.11.md',
        content: messages[lang].docTemplate('Ansible 2.11', 'ansible~2.11')
      },
      {
        name: 'django-5.2.md',
        content: messages[lang].docTemplate('Django 5.2', 'django~5.2')
      },
      {
        name: 'flask.md',
        content: messages[lang].docTemplate('Flask', 'flask')
      },
      {
        name: 'fastapi.md',
        content: messages[lang].docTemplate('FastAPI', 'fastapi')
      },
      {
        name: 'spring-boot.md',
        content: messages[lang].docTemplate('Spring Boot', 'spring_boot')
      },
      {
        name: 'php.md',
        content: messages[lang].docTemplate('PHP', 'php')
      },
      {
        name: 'laravel-11.md',
        content: messages[lang].docTemplate('Laravel 11', 'laravel~11')
      },
      {
        name: 'ruby-3.4.md',
        content: messages[lang].docTemplate('Ruby 3.4', 'ruby~3.4')
      },
      {
        name: 'rails-8.0.md',
        content: messages[lang].docTemplate('Ruby on Rails 8.0', 'rails~8.0')
      },
      {
        name: 'go.md',
        content: messages[lang].docTemplate('Go', 'go')
      },
      {
        name: 'rust.md',
        content: messages[lang].docTemplate('Rust', 'rust')
      },
      {
        name: 'cpp.md',
        content: messages[lang].docTemplate('C++', 'cpp')
      },
      {
        name: 'csharp.md',
        content: messages[lang].docTemplate('C#', 'csharp')
      },
      {
        name: 'kotlin-1.9.md',
        content: messages[lang].docTemplate('Kotlin 1.9', 'kotlin~1.9')
      },
      {
        name: 'swift.md',
        content: messages[lang].docTemplate('Swift', 'swift')
      },
      {
        name: 'scala-3.2.md',
        content: messages[lang].docTemplate('Scala 3.2', 'scala~3.2')
      },
      {
        name: 'express-4.md',
        content: messages[lang].docTemplate('Express 4', 'express~4')
      },
      {
        name: 'koa-2.md',
        content: messages[lang].docTemplate('Koa 2', 'koa~2')
      },
      {
        name: 'man.md',
        content: messages[lang].docTemplate('Linux Manual Pages', 'man')
      },
      {
        name: 'bash.md',
        content: messages[lang].docTemplate('Bash', 'bash')
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
    console.log(messages[lang].example1);
    console.log(messages[lang].example2);
    console.log(messages[lang].example3);
    console.log(messages[lang].step2);
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
        content: messages[lang].searchTemplate
      },
      {
        name: 'typescript.md',
        content: messages[lang].docTemplate('TypeScript', 'typescript')
      },
      {
        name: 'javascript.md',
        content: messages[lang].docTemplate('JavaScript', 'javascript')
      },
      {
        name: 'python-3.12.md',
        content: messages[lang].docTemplate('Python 3.12', 'python~3.12')
      },
      {
        name: 'openjdk-21.md',
        content: messages[lang].docTemplate('OpenJDK 21', 'openjdk~21')
      },
      {
        name: 'postgresql-17.md',
        content: messages[lang].docTemplate('PostgreSQL 17', 'postgresql~17')
      },
      {
        name: 'mysql.md',
        content: messages[lang].docTemplate('MySQL', 'mysql')
      },
      {
        name: 'sqlite.md',
        content: messages[lang].docTemplate('SQLite', 'sqlite')
      },
      {
        name: 'redis.md',
        content: messages[lang].docTemplate('Redis', 'redis')
      },
      {
        name: 'mongodb.md',
        content: messages[lang].docTemplate('MongoDB', 'mongodb')
      },
      {
        name: 'git.md',
        content: messages[lang].docTemplate('Git', 'git')
      },
      {
        name: 'docker-19.md',
        content: messages[lang].docTemplate('Docker 19', 'docker~19')
      },
      {
        name: 'kubernetes-1.28.md',
        content: messages[lang].docTemplate('Kubernetes 1.28', 'kubernetes~1.28')
      },
      {
        name: 'terraform.md',
        content: messages[lang].docTemplate('Terraform', 'terraform')
      },
      {
        name: 'ansible-2.11.md',
        content: messages[lang].docTemplate('Ansible 2.11', 'ansible~2.11')
      },
      {
        name: 'django-5.2.md',
        content: messages[lang].docTemplate('Django 5.2', 'django~5.2')
      },
      {
        name: 'flask.md',
        content: messages[lang].docTemplate('Flask', 'flask')
      },
      {
        name: 'fastapi.md',
        content: messages[lang].docTemplate('FastAPI', 'fastapi')
      },
      {
        name: 'spring-boot.md',
        content: messages[lang].docTemplate('Spring Boot', 'spring_boot')
      },
      {
        name: 'php.md',
        content: messages[lang].docTemplate('PHP', 'php')
      },
      {
        name: 'laravel-11.md',
        content: messages[lang].docTemplate('Laravel 11', 'laravel~11')
      },
      {
        name: 'ruby-3.4.md',
        content: messages[lang].docTemplate('Ruby 3.4', 'ruby~3.4')
      },
      {
        name: 'rails-8.0.md',
        content: messages[lang].docTemplate('Ruby on Rails 8.0', 'rails~8.0')
      },
      {
        name: 'go.md',
        content: messages[lang].docTemplate('Go', 'go')
      },
      {
        name: 'rust.md',
        content: messages[lang].docTemplate('Rust', 'rust')
      },
      {
        name: 'cpp.md',
        content: messages[lang].docTemplate('C++', 'cpp')
      },
      {
        name: 'csharp.md',
        content: messages[lang].docTemplate('C#', 'csharp')
      },
      {
        name: 'kotlin-1.9.md',
        content: messages[lang].docTemplate('Kotlin 1.9', 'kotlin~1.9')
      },
      {
        name: 'swift.md',
        content: messages[lang].docTemplate('Swift', 'swift')
      },
      {
        name: 'scala-3.2.md',
        content: messages[lang].docTemplate('Scala 3.2', 'scala~3.2')
      },
      {
        name: 'express-4.md',
        content: messages[lang].docTemplate('Express 4', 'express~4')
      },
      {
        name: 'koa-2.md',
        content: messages[lang].docTemplate('Koa 2', 'koa~2')
      },
      {
        name: 'man.md',
        content: messages[lang].docTemplate('Linux Manual Pages', 'man')
      },
      {
        name: 'bash.md',
        content: messages[lang].docTemplate('Bash', 'bash')
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
    console.log(messages[lang].example1);
    console.log(messages[lang].example2);
    console.log(messages[lang].example3);
    console.log(messages[lang].step2);
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
