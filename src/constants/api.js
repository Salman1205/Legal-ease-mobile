// API Configuration
// TypeScript/Node.js Backend (Vercel ready)
// For web testing on laptop: localhost works fine
// For Android emulator: use 10.0.2.2
// For physical device: use your PC's local IP
import { Platform } from 'react-native';

const getBaseUrl = () => {
    // Production: use Vercel domain
    if (process.env.NODE_ENV === 'production') {
        return 'https://mobilebackend-inky.vercel.app';
    }
    // Development
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:3001'; // TypeScript backend
    }
    // Web and iOS use localhost
    return 'http://localhost:3001'; // TypeScript backend
};

export const API_BASE_URL = getBaseUrl();
export const REQUEST_TIMEOUT = 60000; // 60 seconds
export const MAX_MESSAGE_LENGTH = 5000;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
