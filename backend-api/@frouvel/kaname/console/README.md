# Artisan Console

PHP Artisan-like command line interface for frourio-framework. This module provides a robust foundation for creating and managing console commands.

## Overview

The Artisan Console provides:
- **Base Command Class**: Abstract class for creating commands with built-in helper methods
- **Command Registration**: Automatic command registration through service providers
- **Signature-based Configuration**: Declarative command definitions with arguments and options
- **Type Safety**: Full TypeScript support with type inference

## Quick Start

### Running Commands

```bash
# Run commands using npm script (required for TypeScript support)
npm run artisan <command> [arguments] [options]

# Examples
npm run artisan inspire
npm run artisan greet "John" --title "Dr."
npm run artisan config:cache
npm run artisan config:clear
```

**Note:** The artisan commands must be run through `npm run artisan` (not `npx artisan`) because they require TypeScript execution via tsx.

### Interactive REPL (Tinker)

Start an interactive REPL session to interact with your application:

```bash
npm run artisan tinker
```

**Quick Example - Query All Users:**
```javascript
> // Query all users
> const users = await prisma.user.findMany()
> console.log(users)
[]  // Returns array of users

> // Count users
> await prisma.user.count()
0   // Returns count

> // Find first user
> const user = await prisma.user.findFirst()
> console.log(user)

> // Get user by ID (if you know the ID)
> await prisma.user.findUnique({ where: { id: 'some-uuid-here' } })

> .exit
```

**Note:** If you need to create test data, use your API endpoints or Prisma Studio instead of tinker. Tinker is best for **querying and inspecting** data.

See the [Tinker Guide](TINKER_GUIDE.md) for comprehensive examples and usage patterns.

### Available Commands

```bash
npm run artisan --help           # List all available commands
npm run artisan <command> --help # Get help for a specific command
```

## Creating a Command

### 1. Define Your Command Class

Create a new command by extending the [`Command`](Command.ts:26) base class:

```typescript
import { Command, type CommandSignature } from '$/@frouvel/kaname/console';

export class MyCommand extends Command {
  protected signature(): CommandSignature {
    return {
      name: 'my:command',
      description: 'Description of what the command does',
      arguments: [
        {
          name: 'arg1',
          description: 'First argument description',
          required: true,
        },
      ],
      options: [
        {
          flags: '-f, --force',
          description: 'Force the operation',
        },
      ],
    };
  }

  async handle(arg1: string, options: { force?: boolean }): Promise<void> {
    this.info('Command is running...');
    
    // Your command logic here
    
    this.success('Command completed successfully!');
  }
}
```

### 2. Register Your Command

Register the command in [`AppServiceProvider`](../../../app/providers/AppServiceProvider.ts):

```typescript
import type { Application, ServiceProvider } from '$/@frouvel/kaname/foundation';
import type { ConsoleKernel } from '$/@frouvel/kaname/foundation';
import { MyCommand } from '$/app/console/MyCommand';

export class AppServiceProvider implements ServiceProvider {
  register(_app: Application): void {
    // Register application services here
  }

  async boot(app: Application): Promise<void> {
    const kernel = app.make<ConsoleKernel>('ConsoleKernel');
    
    // Register your custom commands here
    kernel.registerCommands([
      new MyCommand(app),
      // Add more commands here
    ]);
  }
}
```

## Command Signature

The [`signature()`](Command.ts:37) method defines your command's interface:

### Command Name

```typescript
{
  name: 'namespace:command',  // Use colon for grouping (e.g., config:cache)
  description: 'Brief description of the command',
}
```

### Arguments

```typescript
arguments: [
  {
    name: 'user',           // Argument name
    description: 'User ID', // Help text
    required: true,         // Whether required (default: false)
    defaultValue: '1',      // Default value if not provided
  },
]
```

### Options

```typescript
options: [
  {
    flags: '-f, --force',              // Short and long flags
    description: 'Force the operation',
    defaultValue: false,               // Default value
  },
  {
    flags: '-m, --message <msg>',      // Option with value
    description: 'Custom message',
  },
]
```

## Helper Methods

The [`Command`](Command.ts:26) base class provides several helper methods:

### Console Output

```typescript
this.info('Information message');     // ℹ️  Information message
this.success('Success message');      // ✅ Success message
this.warn('Warning message');         // ⚠️  Warning message
this.error('Error message');          // ❌ Error message
this.comment('Comment message');      // 💬 Comment message
this.line('Plain text');              // Plain text
this.newLine();                       // Blank line
```

### Calling Other Commands

```typescript
// Call another command programmatically
await this.call('config:cache');

// Call with parameters
await this.call('my:command', { arg1: 'value', force: true });
```

### Accessing the Application

```typescript
// Access services from the container
const prisma = this.app.make('prisma');
```

## Built-in Commands

### Config Commands

#### config:cache
Creates a cache file for faster configuration loading.

```bash
npm run artisan config:cache
```

#### config:clear
Removes the configuration cache file.

```bash
npm run artisan config:clear
```

### Utility Commands

#### inspire
Displays an inspiring quote.

```bash
npm run artisan inspire
```

#### greet
Example command demonstrating arguments and options.

```bash
npm run artisan greet "John"
npm run artisan greet "John" --title "Dr."
```

## Advanced Usage

### Async Operations

Commands can be asynchronous:

```typescript
async handle(): Promise<void> {
  this.info('Starting async operation...');
  
  await this.performAsyncTask();
  
  this.success('Operation completed!');
}

private async performAsyncTask(): Promise<void> {
  // Your async logic
}
```

### Error Handling

Errors thrown in the [`handle()`](Command.ts:41) method are automatically caught:

```typescript
async handle(): Promise<void> {
  // Error will be caught and displayed with proper formatting
  throw new Error('Something went wrong');
}
```

### Type-Safe Options

Define interfaces for your options:

```typescript
interface MyCommandOptions {
  force?: boolean;
  message?: string;
  verbose?: boolean;
}

async handle(arg: string, options: MyCommandOptions): Promise<void> {
  if (options.force) {
    // TypeScript knows 'force' is boolean | undefined
  }
}
```

## Best Practices

1. **Use Namespaces**: Group related commands with colons (e.g., `make:model`, `db:seed`)
2. **Clear Descriptions**: Write concise, helpful descriptions for commands and options
3. **Validate Input**: Validate arguments and options in your `handle` method
4. **Provide Feedback**: Use helper methods to give clear feedback to users
5. **Handle Errors Gracefully**: Throw descriptive errors when operations fail
6. **Keep Commands Focused**: Each command should do one thing well
7. **Use Service Providers**: Register commands in service providers for clean organization

## Examples

### Simple Command

```typescript
import { Command, type CommandSignature } from '$/@frouvel/kaname/console';

export class HelloCommand extends Command {
  protected signature(): CommandSignature {
    return {
      name: 'hello',
      description: 'Say hello',
    };
  }

  handle(): void {
    this.success('Hello, World!');
  }
}
```

### Command with Arguments and Options

```typescript
import { Command, type CommandSignature } from '$/@frouvel/kaname/console';

interface DeployOptions {
  env?: string;
  force?: boolean;
}

export class DeployCommand extends Command {
  protected signature(): CommandSignature {
    return {
      name: 'deploy',
      description: 'Deploy the application',
      arguments: [
        {
          name: 'target',
          description: 'Deployment target (staging|production)',
          required: true,
        },
      ],
      options: [
        {
          flags: '-e, --env <environment>',
          description: 'Environment variables file',
        },
        {
          flags: '-f, --force',
          description: 'Force deployment without confirmation',
        },
      ],
    };
  }

  async handle(target: string, options: DeployOptions): Promise<void> {
    this.info(`Deploying to ${target}...`);

    if (!options.force) {
      const confirmed = await this.confirm('Are you sure?');
      if (!confirmed) {
        this.warn('Deployment cancelled');
        return;
      }
    }

    // Deployment logic here

    this.success('Deployment completed!');
  }
}
```

## Architecture

The Artisan Console is built on top of:
- **Commander.js**: For argument parsing and command routing
- **Application Container**: For dependency injection
- **ConsoleKernel**: For bootstrapping and command registration

## See Also

- [`Command`](Command.ts) - Base command class
- [`ConsoleKernel`](../foundation/ConsoleKernel.ts) - Console kernel
- [Built-in Commands](commands/) - Example implementations