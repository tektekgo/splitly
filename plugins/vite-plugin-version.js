import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';

function getGitCommitCount() {
  try {
    const count = execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim();
    return parseInt(count, 10) || 0;
  } catch (error) {
    console.warn('⚠️  Warning: Could not get git commit count, using timestamp fallback');
    return null;
  }
}

import { readFileSync } from 'fs';

function getVersionFromPackage(root) {
  try {
    const packageJson = JSON.parse(
      readFileSync(join(root, 'package.json'), 'utf-8')
    );
    const version = packageJson.version || '0.0.0';
    const parts = version.split('.');
    return { 
      major: parseInt(parts[0] || '0', 10), 
      minor: parseInt(parts[1] || '0', 10) 
    };
  } catch (error) {
    console.warn('⚠️  Warning: Could not read package.json version, using defaults');
    return { major: 1, minor: 0 };
  }
}

export function vitePluginVersion() {
  return {
    name: 'vite-plugin-version',
    buildStart() {
      const root = process.cwd();
      const { major, minor } = getVersionFromPackage(root);
      const commitCount = getGitCommitCount();
      const patch = commitCount !== null ? commitCount : Math.floor(Date.now() / 1000) % 10000;
      const buildDate = new Date().toISOString();

      const versionContent = `// Auto-generated at build time - DO NOT EDIT MANUALLY
export const VERSION_MAJOR = ${major};
export const VERSION_MINOR = ${minor};
export const VERSION_PATCH = ${patch};
export const BUILD_DATE = '${buildDate}';

export function getVersionString(): string {
  const date = new Date(BUILD_DATE);
  const formattedDate = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  return \`v\${VERSION_MAJOR}.\${VERSION_MINOR}.\${VERSION_PATCH} · Built \${formattedDate}\`;
}

export function getVersion(): { major: number; minor: number; patch: number; buildDate: string } {
  return {
    major: VERSION_MAJOR,
    minor: VERSION_MINOR,
    patch: VERSION_PATCH,
    buildDate: BUILD_DATE
  };
}
`;

      const outputPath = join(root, 'src/version.ts');
      writeFileSync(outputPath, versionContent, 'utf-8');
      
      const formattedDate = new Date(buildDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      console.log(`✓ Generated version.ts: v${major}.${minor}.${patch} · Built ${formattedDate}`);
    }
  };
}

