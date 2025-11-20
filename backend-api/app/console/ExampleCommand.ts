/**
 * Example Custom Command
 *
 * This is an example of how to create a custom artisan command.
 * To register this command, add it to AppServiceProvider.
 */

import { Command } from '$/@frouvel/kaname/console/Command';
import type { Application } from '$/@frouvel/kaname/foundation';

export class ExampleCommand extends Command {
  /**
   * Create a new command instance.
   */
  constructor(app: Application) {
    super(app);
  }

  /**
   * The command signature
   */
  protected signature() {
    return {
      name: 'example',
      description: 'An example custom command',
    };
  }

  /**
   * Execute the console command.
   */
  async handle(): Promise<void> {
    this.info('This is an example custom command!');
    this.info('');
    this.info('To create your own command:');
    this.line('1. Create a new file in app/console/');
    this.line('2. Extend the Command class');
    this.line('3. Define signature and description');
    this.line('4. Implement the handle() method');
    this.line('5. Register it in AppServiceProvider');
    this.info('');
    this.success('Command executed successfully!');
  }
}
