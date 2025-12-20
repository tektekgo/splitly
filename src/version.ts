// Auto-generated at build time - DO NOT EDIT MANUALLY
export const VERSION_MAJOR = 1;
export const VERSION_MINOR = 0;
export const VERSION_PATCH = 37;
export const BUILD_DATE = '2025-12-20T18:54:06.005Z';

export function getVersionString(): string {
  const date = new Date(BUILD_DATE);
  const formattedDate = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  return `v${VERSION_MAJOR}.${VERSION_MINOR}.${VERSION_PATCH} · Built ${formattedDate}`;
}

export function getVersion(): { major: number; minor: number; patch: number; buildDate: string } {
  return {
    major: VERSION_MAJOR,
    minor: VERSION_MINOR,
    patch: VERSION_PATCH,
    buildDate: BUILD_DATE
  };
}
