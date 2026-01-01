import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.yonghun.helixplot',
    appName: 'HelixPlot',
    webDir: 'dist',
    plugins: {
        Keyboard: {
            resize: 'body',
            resizeOnFullScreen: true,
        },
    },

};

export default config;
