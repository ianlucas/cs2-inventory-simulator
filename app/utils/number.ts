export function range(n: number, count: number = 0) {
  const items = [];
  for (let i = 0; i < n; i += 1) {
    items.push(count);
    count += 1;
  }
  return items;
}
