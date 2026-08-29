import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sitegenius.dimsumcrm',
  appName: 'Dimsum CRM',
  webDir: 'build' ,
  server: {
    cleartext: true,
    androidScheme: 'http'
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;