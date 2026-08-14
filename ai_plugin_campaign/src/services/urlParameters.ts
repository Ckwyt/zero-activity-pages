/**
 * 解析活动链接参数，并兼容把第二个及后续参数误写成 `?` 的情况。
 * 例如 `?stage=initial-review?zeroGate=off` 会按
 * `?stage=initial-review&zeroGate=off` 解析。
 */
export function parseFlexibleSearch(value: string | undefined) {
  const input = value?.trim() ?? '';
  const queryStart = input.indexOf('?');
  const query = queryStart >= 0
    ? input.slice(queryStart + 1)
    : input.replace(/^[#&?]+/, '');
  return new URLSearchParams(query.replaceAll('?', '&'));
}

/**
 * 从多个参数来源中读取最后一个有效值。
 * Hash 路由参数可以覆盖 document query；同名参数重复追加时最后一个有效值生效。
 */
export function readLastValidParameter<T extends string>(
  name: string,
  allowedValues: readonly T[],
  ...searchValues: Array<string | undefined>
): T | undefined {
  let result: T | undefined;
  for (const search of searchValues) {
    for (const value of parseFlexibleSearch(search).getAll(name)) {
      const normalized = value.trim().toLowerCase() as T;
      if (allowedValues.includes(normalized)) result = normalized;
    }
  }
  return result;
}

export function getCurrentCampaignSearchValues() {
  if (typeof window === 'undefined') return [];
  return [window.location.search, window.location.hash];
}
