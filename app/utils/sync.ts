const queue: [string, any][] = [];

export async function sync(url: string, data: any) {
  queue.push([url, data]);
  if (queue.length > 1) {
    return;
  }
  while (queue[0]) {
    [url, data] = queue.shift()!;
    await fetch(url, {
      method: "POST",
      body: JSON.stringify(data)
    });
  }
}
