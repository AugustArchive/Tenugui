/**
 * Copyright (c) 2020 August, Ice
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import type { Client } from './Client';
import type { Server } from './Server';

/** List of types available for a [Module] */
export enum ModuleType {
  // Servers can't have extended values
  Server = 'server',

  // Clients can have extended values, so a type-param is available
  // in the [Module] class for type safety.
  Client = 'client'
}

export interface ModuleEvents {
  'module.error'(module: Module, error: Error): void;
}

interface ModuleDependency {
  /** If the dependency is required or not */
  required?: boolean;

  /** The name of the dependency */
  name: string;
}

interface ModuleOptions {
  /** List of dependencies this [Module] requires */
  dependencies?: (string | ModuleDependency)[];

  /** The type this module belongs to */
  type: ModuleType;
}

/**
 * Represents a [Module], to handle anything with the client or server,
 * use the `message` event from both client/server to handle TCP messages,
 * this is for internal modularity
 */
export class Module<C extends Client = Client> {
  /** List of dependencies this module needs */
  public dependencies: ModuleDependency[];

  /** The server instance, it's available under the [ModuleType.Server] scope */
  public server!: Server<C>;

  /** The client instance, it's available under the [ModuleType.Client] scope */
  public client!: C;

  /** The name of the module */
  public name: string;

  /** The module type */
  public type: ModuleType;

  /**
   * Creates a new [Module] instance
   * @param name The name of the module
   * @param options The options for this [Module]
   */
  constructor(name: string, options: ModuleOptions) {
    this.dependencies = [];
    this.name = name;
    this.type = options.type;

    if (options.dependencies !== undefined) {
      for (let i = 0; i < options.dependencies.length; i++) {
        const dependency = options.dependencies[i];
        if (typeof dependency === 'string') {
          this.dependencies.push({ name: dependency, required: true });
        } else {
          this.dependencies.push(dependency);
        }
      }
    }
  }

  init(server?: Server<C>, client?: C) {
    if (server !== undefined) {
      this.server = server;
    }

    if (client !== undefined) {
      this.client = client;
    }

    try {
      this._createTree();
      this.onLoad();
    } catch(error) {
      // ignore errors that require functionality (onLoad)
      if (error instanceof TypeError && error.message.indexOf('Missing functionality') !== -1) return;

      this.server?.emit('module.error', this, error);
      this.client?.emit('module.error', this, error);
    }
  }

  /**
   * Lifecycle hook when this module is loaded
   */
  onLoad() {
    throw new TypeError('Missing functionality on lifecycle hook [onLoad]');
  }

  /**
   * Lifecycle hook when this module is un-loaded
   */
  onUnload() {
    throw new TypeError('Missing functionality on lifecycle hook [onUnload]');
  }

  /**
   * Lifecycle hook when we receive a message from server <- -> client, only
   * do this when the module needs it, not on every message.
   *
   * @param message The message
   */
  onMessage<T = unknown>(message: T) {
    throw new TypeError('Missing functionality on lifecycle hook [onMessage]');
  }

  private _createTree() {
    // find dependencies if the type == ModuleType.Client
    if (this.type === ModuleType.Client) {
      // noop
    }

    // find dependencies if the type == ModuleType.Server
    if (this.type === ModuleType.Server) {
      // noop
    }
  }
}
