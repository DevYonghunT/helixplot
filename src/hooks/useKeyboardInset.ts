import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

export function useKeyboardInset() {
    useEffect(() => {
        const isNative = Capacitor.isNativePlatform();
        let cleanup = () => { };

        if (isNative) {
            // Native: Use Capacitor Keyboard Plugin
            const setKb = (height: number) => {
                document.documentElement.style.setProperty('--kb', `${height}px`);
            };

            const onShow = Keyboard.addListener('keyboardWillShow', info => {
                setKb(info.keyboardHeight);
            });
            const onHide = Keyboard.addListener('keyboardWillHide', () => {
                setKb(0);
            });

            cleanup = () => {
                onShow.then(h => h.remove());
                onHide.then(h => h.remove());
                setKb(0);
            };
        } else {
            // Web: Use VisualViewport
            if (!window.visualViewport) return;

            const handleResize = () => {
                const vv = window.visualViewport;
                if (!vv) return;

                const kbHeight = window.innerHeight - vv.height;
                const safeKb = Math.max(0, kbHeight);
                document.documentElement.style.setProperty('--kb', `${safeKb}px`);
            };

            window.visualViewport.addEventListener('resize', handleResize);
            window.visualViewport.addEventListener('scroll', handleResize);
            handleResize(); // Init

            cleanup = () => {
                window.visualViewport?.removeEventListener('resize', handleResize);
                window.visualViewport?.removeEventListener('scroll', handleResize);
                document.documentElement.style.setProperty('--kb', '0px');
            };
        }

        return cleanup;
    }, []);
}
