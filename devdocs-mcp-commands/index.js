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

* Limit search_specific_docs to a maximum of 10 searches. If no results are found, perform a regular web search instead.
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

* search_specific_docsでの検索は最大10回まででお願いします。検索結果が一件もなかった場合は、通常のweb検索を行ってください。
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
      // Additional languages and frameworks
      {
        name: 'angular.md',
        content: messages[lang].docTemplate('Angular', 'angular')
      },
      {
        name: 'angularjs-1.8.md',
        content: messages[lang].docTemplate('Angular.js 1.8', 'angularjs~1.8')
      },
      {
        name: 'c.md',
        content: messages[lang].docTemplate('C', 'c')
      },
      {
        name: 'crystal.md',
        content: messages[lang].docTemplate('Crystal', 'crystal')
      },
      {
        name: 'd.md',
        content: messages[lang].docTemplate('D', 'd')
      },
      {
        name: 'dart-2.md',
        content: messages[lang].docTemplate('Dart 2', 'dart~2')
      },
      {
        name: 'elixir-1.18.md',
        content: messages[lang].docTemplate('Elixir 1.18', 'elixir~1.18')
      },
      {
        name: 'erlang-26.md',
        content: messages[lang].docTemplate('Erlang 26', 'erlang~26')
      },
      {
        name: 'haskell-9.md',
        content: messages[lang].docTemplate('Haskell 9', 'haskell~9')
      },
      {
        name: 'haxe.md',
        content: messages[lang].docTemplate('Haxe', 'haxe')
      },
      {
        name: 'julia-1.11.md',
        content: messages[lang].docTemplate('Julia 1.11', 'julia~1.11')
      },
      {
        name: 'lua-5.4.md',
        content: messages[lang].docTemplate('Lua 5.4', 'lua~5.4')
      },
      {
        name: 'nim.md',
        content: messages[lang].docTemplate('Nim', 'nim')
      },
      {
        name: 'ocaml.md',
        content: messages[lang].docTemplate('OCaml', 'ocaml')
      },
      {
        name: 'perl-5.42.md',
        content: messages[lang].docTemplate('Perl 5.42', 'perl~5.42')
      },
      {
        name: 'python-3.14.md',
        content: messages[lang].docTemplate('Python 3.14', 'python~3.14')
      },
      {
        name: 'r.md',
        content: messages[lang].docTemplate('R', 'r')
      },
      {
        name: 'zig.md',
        content: messages[lang].docTemplate('Zig', 'zig')
      },
      {
        name: 'zsh.md',
        content: messages[lang].docTemplate('Zsh', 'zsh')
      },
      // Frameworks and libraries
      {
        name: 'react.md',
        content: messages[lang].docTemplate('React', 'react')
      },
      {
        name: 'vue-3.md',
        content: messages[lang].docTemplate('Vue 3', 'vue~3')
      },
      {
        name: 'svelte.md',
        content: messages[lang].docTemplate('Svelte', 'svelte')
      },
      {
        name: 'nextjs.md',
        content: messages[lang].docTemplate('Next.js', 'nextjs')
      },
      {
        name: 'express.md',
        content: messages[lang].docTemplate('Express', 'express')
      },
      {
        name: 'koa.md',
        content: messages[lang].docTemplate('Koa', 'koa')
      },
      {
        name: 'tailwindcss.md',
        content: messages[lang].docTemplate('Tailwind CSS', 'tailwindcss')
      },
      {
        name: 'bootstrap-5.md',
        content: messages[lang].docTemplate('Bootstrap 5', 'bootstrap~5')
      },
      // Databases
      {
        name: 'mariadb.md',
        content: messages[lang].docTemplate('MariaDB', 'mariadb')
      },
      // Tools and utilities
      {
        name: 'docker.md',
        content: messages[lang].docTemplate('Docker', 'docker')
      },
      {
        name: 'kubernetes.md',
        content: messages[lang].docTemplate('Kubernetes', 'kubernetes')
      },
      {
        name: 'kubectl.md',
        content: messages[lang].docTemplate('Kubectl', 'kubectl')
      },
      {
        name: 'nginx.md',
        content: messages[lang].docTemplate('nginx', 'nginx')
      },
      {
        name: 'ansible.md',
        content: messages[lang].docTemplate('Ansible', 'ansible')
      },
      {
        name: 'vagrant.md',
        content: messages[lang].docTemplate('Vagrant', 'vagrant')
      },
      {
        name: 'npm.md',
        content: messages[lang].docTemplate('npm', 'npm')
      },
      {
        name: 'yarn.md',
        content: messages[lang].docTemplate('Yarn', 'yarn')
      },
      {
        name: 'webpack-5.md',
        content: messages[lang].docTemplate('webpack 5', 'webpack~5')
      },
      {
        name: 'vite.md',
        content: messages[lang].docTemplate('Vite', 'vite')
      },
      {
        name: 'esbuild.md',
        content: messages[lang].docTemplate('esbuild', 'esbuild')
      },
      // System and OS
      {
        name: 'fish-4.0.md',
        content: messages[lang].docTemplate('Fish 4.0', 'fish~4.0')
      },
      {
        name: 'homebrew.md',
        content: messages[lang].docTemplate('Homebrew', 'homebrew')
      },
      {
        name: 'i3.md',
        content: messages[lang].docTemplate('i3', 'i3')
      },
      // Web technologies
      {
        name: 'html.md',
        content: messages[lang].docTemplate('HTML', 'html')
      },
      {
        name: 'css.md',
        content: messages[lang].docTemplate('CSS', 'css')
      },
      {
        name: 'svg.md',
        content: messages[lang].docTemplate('SVG', 'svg')
      },
      {
        name: 'http.md',
        content: messages[lang].docTemplate('HTTP', 'http')
      },
      {
        name: 'dom.md',
        content: messages[lang].docTemplate('Web APIs', 'dom')
      },
      {
        name: 'web-extensions.md',
        content: messages[lang].docTemplate('Web Extensions', 'web_extensions')
      },
      // Machine Learning and Data Science
      {
        name: 'tensorflow.md',
        content: messages[lang].docTemplate('TensorFlow', 'tensorflow')
      },
      {
        name: 'pytorch-2.7.md',
        content: messages[lang].docTemplate('PyTorch 2.7', 'pytorch~2.7')
      },
      {
        name: 'numpy-2.2.md',
        content: messages[lang].docTemplate('NumPy 2.2', 'numpy~2.2')
      },
      {
        name: 'pandas-2.md',
        content: messages[lang].docTemplate('pandas 2', 'pandas~2')
      },
      {
        name: 'matplotlib.md',
        content: messages[lang].docTemplate('Matplotlib', 'matplotlib')
      },
      {
        name: 'scikit-learn.md',
        content: messages[lang].docTemplate('scikit-learn', 'scikit_learn')
      },
      {
        name: 'scikit-image.md',
        content: messages[lang].docTemplate('scikit-image', 'scikit_image')
      },
      // Other technologies
      {
        name: 'latex.md',
        content: messages[lang].docTemplate('LaTeX', 'latex')
      },
      {
        name: 'markdown.md',
        content: messages[lang].docTemplate('Markdown', 'markdown')
      },
      {
        name: 'liquid.md',
        content: messages[lang].docTemplate('Liquid', 'liquid')
      },
      {
        name: 'sass.md',
        content: messages[lang].docTemplate('Sass', 'sass')
      },
      {
        name: 'less-4.md',
        content: messages[lang].docTemplate('Less 4', 'less~4')
      },
      {
        name: 'pug.md',
        content: messages[lang].docTemplate('Pug', 'pug')
      },
      {
        name: 'handlebars.md',
        content: messages[lang].docTemplate('Handlebars.js', 'handlebars')
      },
      {
        name: 'jquery.md',
        content: messages[lang].docTemplate('jQuery', 'jquery')
      },
      {
        name: 'lodash-4.md',
        content: messages[lang].docTemplate('lodash 4', 'lodash~4')
      },
      {
        name: 'moment.md',
        content: messages[lang].docTemplate('Moment.js', 'moment')
      },
      {
        name: 'axios.md',
        content: messages[lang].docTemplate('Axios', 'axios')
      },
      {
        name: 'threejs.md',
        content: messages[lang].docTemplate('Three.js', 'threejs')
      },
      {
        name: 'phaser.md',
        content: messages[lang].docTemplate('Phaser', 'phaser')
      },
      {
        name: 'electron.md',
        content: messages[lang].docTemplate('Electron', 'electron')
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
      // Additional languages and frameworks
      {
        name: 'angular.md',
        content: messages[lang].docTemplate('Angular', 'angular')
      },
      {
        name: 'angularjs-1.8.md',
        content: messages[lang].docTemplate('Angular.js 1.8', 'angularjs~1.8')
      },
      {
        name: 'c.md',
        content: messages[lang].docTemplate('C', 'c')
      },
      {
        name: 'crystal.md',
        content: messages[lang].docTemplate('Crystal', 'crystal')
      },
      {
        name: 'd.md',
        content: messages[lang].docTemplate('D', 'd')
      },
      {
        name: 'dart-2.md',
        content: messages[lang].docTemplate('Dart 2', 'dart~2')
      },
      {
        name: 'elixir-1.18.md',
        content: messages[lang].docTemplate('Elixir 1.18', 'elixir~1.18')
      },
      {
        name: 'erlang-26.md',
        content: messages[lang].docTemplate('Erlang 26', 'erlang~26')
      },
      {
        name: 'haskell-9.md',
        content: messages[lang].docTemplate('Haskell 9', 'haskell~9')
      },
      {
        name: 'haxe.md',
        content: messages[lang].docTemplate('Haxe', 'haxe')
      },
      {
        name: 'julia-1.11.md',
        content: messages[lang].docTemplate('Julia 1.11', 'julia~1.11')
      },
      {
        name: 'lua-5.4.md',
        content: messages[lang].docTemplate('Lua 5.4', 'lua~5.4')
      },
      {
        name: 'nim.md',
        content: messages[lang].docTemplate('Nim', 'nim')
      },
      {
        name: 'ocaml.md',
        content: messages[lang].docTemplate('OCaml', 'ocaml')
      },
      {
        name: 'perl-5.42.md',
        content: messages[lang].docTemplate('Perl 5.42', 'perl~5.42')
      },
      {
        name: 'python-3.14.md',
        content: messages[lang].docTemplate('Python 3.14', 'python~3.14')
      },
      {
        name: 'r.md',
        content: messages[lang].docTemplate('R', 'r')
      },
      {
        name: 'zig.md',
        content: messages[lang].docTemplate('Zig', 'zig')
      },
      {
        name: 'zsh.md',
        content: messages[lang].docTemplate('Zsh', 'zsh')
      },
      // Frameworks and libraries
      {
        name: 'react.md',
        content: messages[lang].docTemplate('React', 'react')
      },
      {
        name: 'vue-3.md',
        content: messages[lang].docTemplate('Vue 3', 'vue~3')
      },
      {
        name: 'svelte.md',
        content: messages[lang].docTemplate('Svelte', 'svelte')
      },
      {
        name: 'nextjs.md',
        content: messages[lang].docTemplate('Next.js', 'nextjs')
      },
      {
        name: 'express.md',
        content: messages[lang].docTemplate('Express', 'express')
      },
      {
        name: 'koa.md',
        content: messages[lang].docTemplate('Koa', 'koa')
      },
      {
        name: 'tailwindcss.md',
        content: messages[lang].docTemplate('Tailwind CSS', 'tailwindcss')
      },
      {
        name: 'bootstrap-5.md',
        content: messages[lang].docTemplate('Bootstrap 5', 'bootstrap~5')
      },
      // Databases
      {
        name: 'mariadb.md',
        content: messages[lang].docTemplate('MariaDB', 'mariadb')
      },
      // Tools and utilities
      {
        name: 'docker.md',
        content: messages[lang].docTemplate('Docker', 'docker')
      },
      {
        name: 'kubernetes.md',
        content: messages[lang].docTemplate('Kubernetes', 'kubernetes')
      },
      {
        name: 'kubectl.md',
        content: messages[lang].docTemplate('Kubectl', 'kubectl')
      },
      {
        name: 'nginx.md',
        content: messages[lang].docTemplate('nginx', 'nginx')
      },
      {
        name: 'ansible.md',
        content: messages[lang].docTemplate('Ansible', 'ansible')
      },
      {
        name: 'vagrant.md',
        content: messages[lang].docTemplate('Vagrant', 'vagrant')
      },
      {
        name: 'npm.md',
        content: messages[lang].docTemplate('npm', 'npm')
      },
      {
        name: 'yarn.md',
        content: messages[lang].docTemplate('Yarn', 'yarn')
      },
      {
        name: 'webpack-5.md',
        content: messages[lang].docTemplate('webpack 5', 'webpack~5')
      },
      {
        name: 'vite.md',
        content: messages[lang].docTemplate('Vite', 'vite')
      },
      {
        name: 'esbuild.md',
        content: messages[lang].docTemplate('esbuild', 'esbuild')
      },
      // System and OS
      {
        name: 'fish-4.0.md',
        content: messages[lang].docTemplate('Fish 4.0', 'fish~4.0')
      },
      {
        name: 'homebrew.md',
        content: messages[lang].docTemplate('Homebrew', 'homebrew')
      },
      {
        name: 'i3.md',
        content: messages[lang].docTemplate('i3', 'i3')
      },
      // Web technologies
      {
        name: 'html.md',
        content: messages[lang].docTemplate('HTML', 'html')
      },
      {
        name: 'css.md',
        content: messages[lang].docTemplate('CSS', 'css')
      },
      {
        name: 'svg.md',
        content: messages[lang].docTemplate('SVG', 'svg')
      },
      {
        name: 'http.md',
        content: messages[lang].docTemplate('HTTP', 'http')
      },
      {
        name: 'dom.md',
        content: messages[lang].docTemplate('Web APIs', 'dom')
      },
      {
        name: 'web-extensions.md',
        content: messages[lang].docTemplate('Web Extensions', 'web_extensions')
      },
      // Machine Learning and Data Science
      {
        name: 'tensorflow.md',
        content: messages[lang].docTemplate('TensorFlow', 'tensorflow')
      },
      {
        name: 'pytorch-2.7.md',
        content: messages[lang].docTemplate('PyTorch 2.7', 'pytorch~2.7')
      },
      {
        name: 'numpy-2.2.md',
        content: messages[lang].docTemplate('NumPy 2.2', 'numpy~2.2')
      },
      {
        name: 'pandas-2.md',
        content: messages[lang].docTemplate('pandas 2', 'pandas~2')
      },
      {
        name: 'matplotlib.md',
        content: messages[lang].docTemplate('Matplotlib', 'matplotlib')
      },
      {
        name: 'scikit-learn.md',
        content: messages[lang].docTemplate('scikit-learn', 'scikit_learn')
      },
      {
        name: 'scikit-image.md',
        content: messages[lang].docTemplate('scikit-image', 'scikit_image')
      },
      // Other technologies
      {
        name: 'latex.md',
        content: messages[lang].docTemplate('LaTeX', 'latex')
      },
      {
        name: 'markdown.md',
        content: messages[lang].docTemplate('Markdown', 'markdown')
      },
      {
        name: 'liquid.md',
        content: messages[lang].docTemplate('Liquid', 'liquid')
      },
      {
        name: 'sass.md',
        content: messages[lang].docTemplate('Sass', 'sass')
      },
      {
        name: 'less-4.md',
        content: messages[lang].docTemplate('Less 4', 'less~4')
      },
      {
        name: 'pug.md',
        content: messages[lang].docTemplate('Pug', 'pug')
      },
      {
        name: 'handlebars.md',
        content: messages[lang].docTemplate('Handlebars.js', 'handlebars')
      },
      {
        name: 'jquery.md',
        content: messages[lang].docTemplate('jQuery', 'jquery')
      },
      {
        name: 'lodash-4.md',
        content: messages[lang].docTemplate('lodash 4', 'lodash~4')
      },
      {
        name: 'moment.md',
        content: messages[lang].docTemplate('Moment.js', 'moment')
      },
      {
        name: 'axios.md',
        content: messages[lang].docTemplate('Axios', 'axios')
      },
      {
        name: 'threejs.md',
        content: messages[lang].docTemplate('Three.js', 'threejs')
      },
      {
        name: 'phaser.md',
        content: messages[lang].docTemplate('Phaser', 'phaser')
      },
      {
        name: 'electron.md',
        content: messages[lang].docTemplate('Electron', 'electron')
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
