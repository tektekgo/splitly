import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.splitbi.splitbi',
  appName: 'SplitBi',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'https://splitbi.app',
    cleartext: true,
  }
};

export default config;

