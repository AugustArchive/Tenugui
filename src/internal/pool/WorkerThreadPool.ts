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

import { Collection, Queue } from '@augu/immutable';
import AsyncPoolResource from './AsyncPoolTaskResource';
import { Worker } from 'worker_threads';
import EventBus from '../EventBus';

interface WorkerThreadPoolEvents {
  create(): void;

  error(worker: Worker, error: Error): void;
  free(worker: Worker): void;
}

interface RanResult<D> {
  result: D;
  worker: Worker;
}

const kResourceInfo = Symbol('kResourceInfo');

/** Thread pool to execute and build workers */
export default class WorkerThreadPool extends EventBus<WorkerThreadPoolEvents> {
  /** List of free workers available */
  public freedWorkers: Queue<Worker>;

  /** Number of threads for this [WorkerThreadPool] */
  public numThreads: number;

  /** The file name to build the worker */
  public filename: string;

  /** List of available workers */
  public workers: Collection<Worker>;

  /**
   * Thread pool to execute and build workers
   * @param filename The file name to build the worker
   * @param numThreads Number of threads to build
   */
  constructor(filename: string, numThreads: number) {
    super();

    this.freedWorkers = new Queue();
    this.numThreads = numThreads;
    this.filename = filename;
    this.workers = new Collection();

    for (let i = 0; i < numThreads; i++)
      this._build();
  }

  private _build() {
    const worker = new Worker(this.filename);

    worker.on('message', (result) => {
      worker[kResourceInfo]?.done(null, result);
      worker[kResourceInfo] = null;

      this.freedWorkers.add(worker);
      this.emit('free', worker);
    });

    worker.on('error', (error) => {
      worker[kResourceInfo]?.done(error, null);
      this.emit('error', worker, error);
    });

    this.workers.set(`thread:${worker.threadId}`, worker);
    this.freedWorkers.add(worker);

    this.emit('free', worker);
  }

  /**
   * Runs anything in the thread pool and returns data
   * @param data The data to use
   * @returns A Promise of the data or a error thrown
   */
  run<R = unknown, D = unknown>(task: R) {
    return new Promise<RanResult<D>>((resolve, reject) => {
      if (this.freedWorkers.empty) {
        this.once('free', () => {
          this.run<R, D>(task)
            .then(resolve)
            .catch(reject);
        });

        return;
      }

      const worker = this.freedWorkers.unshift()!;
      worker[kResourceInfo] = new AsyncPoolResource(worker, (w: Worker, error, result) => {
        if (error) return reject(error);
        if (worker.threadId !== w.threadId) return reject(new Error(`Received data from thread '${w.threadId}' when it should be from thread '${worker.threadId}'`));

        return resolve({ worker: w, result });
      });

      worker.postMessage(task);
    });
  }

  /**
   * Ends the thread pool
   */
  end() {
    for (const worker of this.workers.values()) worker.terminate();
  }
}
