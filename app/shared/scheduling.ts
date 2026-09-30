/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { logError } from "./monitoring";

/**
 * A self-rescheduling task: `tick` returns the delay until its next run, or
 * `undefined` to stop. A `tick` that throws is logged and also stops the loop.
 * `start` is idempotent.
 */
export class Loop {
  private running = false;

  constructor(private readonly tick: () => Promise<number | undefined>) {}

  start() {
    if (this.running) {
      return;
    }
    this.running = true;
    void this.run();
  }

  private async run() {
    let delay: number | undefined;
    try {
      delay = await this.tick();
    } catch (error) {
      logError("Loop: tick failed, stopping.", { error });
    }
    if (delay === undefined) {
      this.running = false;
      return;
    }
    setTimeout(() => void this.run(), delay);
  }
}

/**
 * Runs `run` on `start`, then again `intervalMs` after each run finishes, so
 * runs never overlap. A failed run is logged and doesn't stop the job.
 */
export class Job {
  private readonly loop = new Loop(() => this.tick());

  constructor(
    readonly name: string,
    private readonly intervalMs: number,
    private readonly run: () => Promise<void>
  ) {}

  start() {
    this.loop.start();
  }

  private async tick() {
    try {
      await this.run();
    } catch (error) {
      logError(`${this.name}: job failed.`, { error });
    }
    return this.intervalMs;
  }
}
