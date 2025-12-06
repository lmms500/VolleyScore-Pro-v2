import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
appId: 'LucasFilms.Studio.volleyscore', // Troque pelo seu ID se tiver mudado
appName: 'VolleyScore Pro',
webDir: 'dist',
server: {
androidScheme: 'https'
}
};

export default config;