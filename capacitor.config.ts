import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.riehls.app',
  appName: 'Riehls',
  webDir: 'dist',
  server: {
    url: 'https://e3d54959-1d99-4369-a4a7-9acbee7f2725.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;
