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
      backgroundColor: "#020617", // Cor exata do bg-slate-950
      launchShowDuration: 1500,   // Tempo curto para parecer rápido
      launchAutoHide: true,
      showSpinner: false,         // Remove o spinner de carregamento nativo
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
    }
  }
};

export default config;
