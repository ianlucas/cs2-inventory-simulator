export function toValveKeyValue(obj: any) {
  let vkv = "{";
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }
    vkv += `"${key}" `;
    vkv += (typeof value === "object")
      ? toValveKeyValue(value)
      : typeof value === "boolean"
      ? value ? '"1"\n' : '"0"\n'
      : `"${value}"\n`;
  }
  vkv += "}";
  return vkv;
}
