// API Configuration — defaults to the deployed Vercel backend so the app
// works out of the box on every device. Override with EXPO_PUBLIC_API_URL in
// .env to point at a local FastAPI instance (http://localhost:8000/api) or
// your PC's LAN IP when running on a physical phone.
import { Platform } from 'react-native';

const PROD_BASE_URL = 'https://mobilebackend-inky.vercel.app/api';

const getBaseUrl = () => {
    const override = process.env.EXPO_PUBLIC_API_URL;
    if (override) return override.replace(/\/+$/, '');
    // Vercel default works for web, iOS, Android, physical devices.
    return PROD_BASE_URL;
};

export const API_BASE_URL = getBaseUrl();
export const REQUEST_TIMEOUT = 60000;
export const MAX_MESSAGE_LENGTH = 5000;
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
