// Auto-generated at build time - DO NOT EDIT MANUALLY
export const VERSION_MAJOR = 1;
export const VERSION_MINOR = 0;
export const VERSION_PATCH = 64;
export const BUILD_DATE = '2026-01-04T16:22:15.601Z';

export function getVersionString(): string {
  const date = new Date(BUILD_DATE);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  return `v${VERSION_MAJOR}.${VERSION_MINOR}.${VERSION_PATCH} Beta · Built ${formattedDate}`;
}

export function getVersion(): { major: number; minor: number; patch: number; buildDate: string } {
  return {
    major: VERSION_MAJOR,
    minor: VERSION_MINOR,
    patch: VERSION_PATCH,
    buildDate: BUILD_DATE
  };
}
