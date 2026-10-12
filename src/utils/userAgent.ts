// Order matters: Edge and Opera UAs also contain "Chrome", and Chrome's contains "Safari"
const BROWSERS: [RegExp, string][] = [
  [/Edg/, 'Edge'],
  [/OPR/, 'Opera'],
  [/Firefox|FxiOS/, 'Firefox'],
  [/Chrome|CriOS/, 'Chrome'],
  [/Safari/, 'Safari'],
]

// iPhone before macOS (its UA says "like Mac OS X"), Android before Linux
const SYSTEMS: [RegExp, string][] = [
  [/iPhone/, 'iPhone'],
  [/iPad/, 'iPad'],
  [/Android/, 'Android'],
  [/Windows/, 'Windows'],
  [/Mac OS X/, 'macOS'],
  [/Linux/, 'Linux'],
]

/** Turns a raw User-Agent into "Chrome on Windows", so people can tell their devices apart. */
export function describeUserAgent(ua: string): string {
  const browser = BROWSERS.find(([re]) => re.test(ua))?.[1]
  const system = SYSTEMS.find(([re]) => re.test(ua))?.[1]
  return browser && system ? `${browser} on ${system}` : 'Unknown device'
}
