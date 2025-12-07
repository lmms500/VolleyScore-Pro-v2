import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.volleyscore.pro',
  appName: 'VolleyScore Pro v2',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      backgroundColor: "#020617",
      launchShowDuration: 2000,
      launchAutoHide: false,
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: false, // <--- CHANGED: Must be false to prevent orientation jump
    }
  }
};

export default config;