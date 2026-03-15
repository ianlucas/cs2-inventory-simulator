/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export class RateLimiter {
  private cooldowns = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(private readonly ms: number) {}

  isLimited(key: string): boolean {
    return this.cooldowns.has(key);
  }

  consume(key: string): void {
    clearTimeout(this.cooldowns.get(key));
    this.cooldowns.set(
      key,
      setTimeout(() => this.cooldowns.delete(key), this.ms)
    );
  }
}
