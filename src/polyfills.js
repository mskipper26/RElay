// Polyfill for crypto.randomUUID in non-secure contexts (HTTP)
if (!window.crypto) {
    window.crypto = {};
}

if (!window.crypto.randomUUID) {
    console.warn('Polyfilling crypto.randomUUID for non-secure context');
    window.crypto.randomUUID = () => {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    };

    // If getRandomValues is also missing (unlikely but possible in very old envs, though usually present, just randomUUID is restricted)
    // Minimal fallback if above fails (Chrome in HTTP allows getRandomValues but not randomUUID?)
    // Actually, getRandomValues is usually available. logic:
    if (!window.crypto.getRandomValues) {
        console.warn('Polyfilling crypto.getRandomValues for non-secure context');
        window.crypto.getRandomValues = function (buffer) {
            for (var i = 0; i < buffer.length; i++) {
                buffer[i] = Math.random() * 256 | 0;
            }
            return buffer;
        };
    }
}
