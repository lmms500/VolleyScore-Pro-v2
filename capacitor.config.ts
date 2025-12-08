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
      backgroundColor: "#020617", // slate-950 (dark theme)
      launchShowDuration: 1500, // Reduced from 2000ms for faster UX
      launchAutoHide: false, // Manual hide for smooth transition
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: false, // Must be false to prevent orientation jump
      iosSpinnerStyle: "small", // iOS loading indicator
      spinnerColor: "#6366f1", // indigo-500 (brand color)
    },
    StatusBar: {
      style: 'DARK', // Light text for dark background
      backgroundColor: '#020617', // slate-950 (matches app background)
      overlaysWebView: false, // StatusBar has fixed height
    }
  }
};

export default config;