import Parse from 'parse';

const PARSE_APP_ID = import.meta.env.VITE_PARSE_APP_ID;
const PARSE_JS_KEY = import.meta.env.VITE_PARSE_JS_KEY;
const PARSE_SERVER_URL = import.meta.env.VITE_PARSE_SERVER_URL;

if (!PARSE_APP_ID || !PARSE_SERVER_URL) {
    console.warn('Parse credentials missing from environment variables.');
}

Parse.initialize(PARSE_APP_ID, PARSE_JS_KEY);
Parse.serverURL = PARSE_SERVER_URL;

export default Parse;
