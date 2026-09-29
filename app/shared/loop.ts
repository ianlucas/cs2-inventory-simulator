/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * A self-rescheduling task: `tick` returns the delay until its next run, or
 * `undefined` to stop. `start` is idempotent.
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
    const delay = await this.tick();
    if (delay === undefined) {
      this.running = false;
      return;
    }
    setTimeout(() => void this.run(), delay);
  }
}
