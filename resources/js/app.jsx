import '../css/app.css';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';

createInertiaApp({
    resolve: (name) => {
        const pages = import.meta.glob('./pages/**/*.jsx', { eager: true });
        const exactMatch = pages[`./pages/${name}.jsx`];

        if (exactMatch) {
            return exactMatch;
        }

        const normalizedTarget = `./pages/${name}.jsx`.toLowerCase();
        const matchedKey = Object.keys(pages).find(
            (key) => key.toLowerCase() === normalizedTarget
        );

        return matchedKey ? pages[matchedKey] : undefined;
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
});
