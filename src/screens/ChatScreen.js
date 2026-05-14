// ChatScreen v9 — Mobile-optimized with proper history modal
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    Alert, Platform, useWindowDimensions, Animated, Modal, SafeAreaView,
    KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, shadows, gradients, typography } from '../constants/theme';
import { apiService } from '../services/api';
import { chatStorage } from '../services/storage';
import { useAppSettings } from '../contexts/AppSettingsContext';
import ChatMessage from '../components/ChatMessage';
import InputBar from '../components/InputBar';
import ShimmerLoader from '../components/ShimmerLoader';
import FadeInView from '../components/FadeInView';
import AnimatedPressable from '../components/AnimatedPressable';
import LawLogo from '../components/LawLogo';

const SUGGESTION_CONFIG = [
    { id: 'banking', icon: 'business-outline', color: colors.accentPrimary, bg: gradients.brand },
    { id: 'criminal', icon: 'shield-checkmark-outline', color: colors.error, bg: gradients.error },
    { id: 'property', icon: 'home-outline', color: colors.success, bg: gradients.success },
    { id: 'family', icon: 'people-outline', color: colors.warning, bg: gradients.warning },
];

const TRUST_METRIC_CONFIG = [
    { id: 'lawCorpus', icon: 'book-outline' },
    { id: 'avgReply', icon: 'time-outline' },
    { id: 'citationMode', icon: 'shield-checkmark-outline' },
];

const QUICK_PROMPT_CONFIG = [
    { id: 'fir', icon: 'shield-outline' },
    { id: 'bail', icon: 'hourglass-outline' },
    { id: 'contract', icon: 'document-text-outline' },
    { id: 'property', icon: 'home-outline' },
];

const ChatScreen = ({ route }) => {
    const { t, language } = useAppSettings();
    const { width: SCREEN_W } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // The custom tab bar is position:absolute, so it floats OVER content. We need
    // enough padding at the bottom of the composer dock to clear its height.
    // 62px bar + bottom inset (safe area / gesture pill) + small breathing room.
    const composerOffset = 62 + Math.max(insets.bottom, 10) + 8;
    const isSmall = SCREEN_W < 360;
    const cardWidth = (SCREEN_W - 48 - 8) / 2;
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [attachedDocument, setAttachedDocument] = useState(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [isMicSupported, setIsMicSupported] = useState(true);
    const flatListRef = useRef(null);
    const speechDraftRef = useRef('');
    const recognitionLang = language === 'ur' ? 'ur-PK' : 'en-US';

    const suggestions = useMemo(() => (
        SUGGESTION_CONFIG.map((item) => ({
            ...item,
            title: t(`chat.suggestion.${item.id}.title`),
            desc: t(`chat.suggestion.${item.id}.desc`),
            prompt: t(`chat.suggestion.${item.id}.prompt`),
        }))
    ), [t]);

    const trustMetrics = useMemo(() => (
        TRUST_METRIC_CONFIG.map((item) => ({
            ...item,
            label: t(`chat.metrics.${item.id}.label`),
            value: t(`chat.metrics.${item.id}.value`),
        }))
    ), [t]);

    const quickPrompts = useMemo(() => (
        QUICK_PROMPT_CONFIG.map((item) => ({
            ...item,
            label: t(`chat.quick.${item.id}.label`),
            prompt: t(`chat.quick.${item.id}.prompt`),
        }))
    ), [t]);

    // Animations
    const heroScale = useRef(new Animated.Value(0.9)).current;
    const heroOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(heroScale, { toValue: 1, tension: 60, friction: 12, useNativeDriver: true }),
            Animated.timing(heroOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]).start();
    }, []);

    // Web Speech API reference (legacy instant path, may not work on all mobile browsers)
    const webRecognitionRef = useRef(null);
    // MediaRecorder + Groq Whisper (bulletproof cross-browser path)
    const mediaRecorderRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const mediaChunksRef = useRef([]);

    const appendTranscript = useCallback((rawTranscript) => {
        const clean = String(rawTranscript || '').replace(/\s+/g, ' ').trim();
        if (!clean) return;
        setInput((prev) => {
            const next = prev ? `${prev} ${clean}` : clean;
            return next;
        });
    }, []);

    const commitSpeechDraft = useCallback(() => {
        const pending = String(speechDraftRef.current || '').replace(/\s+/g, ' ').trim();
        if (pending) {
            appendTranscript(pending);
        }
        speechDraftRef.current = '';
    }, [appendTranscript]);

    const extractTranscript = useCallback((event) => {
        if (!event) return '';

        if (typeof event.transcript === 'string' && event.transcript.trim()) {
            return event.transcript;
        }

        if (Array.isArray(event.results)) {
            for (let i = event.results.length - 1; i >= 0; i -= 1) {
                const item = event.results[i];
                if (typeof item === 'string' && item.trim()) return item;
                if (item?.transcript) return item.transcript;
                if (Array.isArray(item) && item[0]?.transcript) return item[0].transcript;
            }
        }

        if (event.results && typeof event.results.length === 'number') {
            for (let i = event.results.length - 1; i >= 0; i -= 1) {
                const item = event.results[i];
                if (item?.[0]?.transcript) return item[0].transcript;
                if (item?.transcript) return item.transcript;
            }
        }

        return '';
    }, []);

    // Build a fresh Web Speech API recognition instance (required on iOS Safari
    // and many mobile browsers - re-using a stopped instance often fails silently).
    const createWebRecognition = useCallback(() => {
        if (typeof window === 'undefined') return null;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return null;

        const recog = new SpeechRecognition();
        recog.lang = recognitionLang;
        recog.interimResults = true;
        recog.continuous = false;
        recog.maxAlternatives = 1;

        // Track whether we received any recognition result during this session.
        let gotAnyResult = false;

        recog.onstart = () => {
            console.log('[STT] onstart fired');
            gotAnyResult = false;
            setIsListening(true);
        };
        recog.onaudiostart = () => { console.log('[STT] onaudiostart fired'); };
        recog.onaudioend = () => { console.log('[STT] onaudioend fired'); };
        recog.onspeechstart = () => { console.log('[STT] onspeechstart fired'); };
        recog.onspeechend = () => { console.log('[STT] onspeechend fired'); };
        recog.onnomatch = () => { console.log('[STT] onnomatch fired - no match found'); };

        recog.onend = () => {
            console.log('[STT] onend fired, gotAnyResult:', gotAnyResult);
            setIsListening(false);
            commitSpeechDraft();
            if (!gotAnyResult) {
                Alert.alert(
                    'No Speech Detected',
                    'The mic did not catch any speech. Speak clearly and try again. If this keeps happening, check your browser mic permission.'
                );
            }
        };
        recog.onerror = (event) => {
            console.error('[STT] onerror fired:', event?.error, event?.message);
            setIsListening(false);
            const code = event?.error;
            if (code === 'not-allowed' || code === 'service-not-allowed') {
                Alert.alert(
                    t('chat.voicePermissionTitle') || 'Microphone Permission',
                    'Mic is blocked. Tap the lock icon in the address bar → Site settings → Microphone → Allow, then reload the page.'
                );
            } else if (code === 'no-speech') {
                Alert.alert('No Speech', 'The mic did not catch any speech. Try again.');
            } else if (code === 'audio-capture') {
                Alert.alert('No Microphone', 'No microphone was found on this device.');
            } else if (code === 'network') {
                Alert.alert('Network Error', 'Speech recognition needs internet. Check your connection.');
            } else if (code === 'language-not-supported') {
                Alert.alert('Language Not Supported', `${recognitionLang} is not supported by this browser. Falling back to English next time.`);
            } else if (code) {
                Alert.alert('Voice Error', String(code));
            }
        };
        recog.onresult = (event) => {
            console.log('[STT] onresult fired, resultIndex:', event?.resultIndex, 'results.length:', event?.results?.length);
            gotAnyResult = true;
            if (!event?.results) {
                const transcript = extractTranscript(event);
                if (transcript) {
                    // Append directly rather than holding as a draft — mobile browsers
                    // sometimes skip the "isFinal" flag entirely.
                    appendTranscript(transcript);
                }
                return;
            }

            let finalText = '';
            let interimText = '';
            const startIndex = Number.isInteger(event.resultIndex) ? event.resultIndex : 0;
            for (let i = startIndex; i < event.results.length; i += 1) {
                const result = event.results[i];
                const transcript = result?.[0]?.transcript || result?.transcript || '';
                const clean = String(transcript).replace(/\s+/g, ' ').trim();
                if (!clean) continue;
                if (result?.isFinal) {
                    finalText += `${clean} `;
                } else {
                    interimText += `${clean} `;
                }
            }
            console.log('[STT] finalText:', finalText, 'interimText:', interimText);
            if (finalText.trim()) {
                appendTranscript(finalText);
                speechDraftRef.current = '';
            } else if (interimText.trim()) {
                speechDraftRef.current = interimText;
            }
        };
        return recog;
    }, [recognitionLang, commitSpeechDraft, extractTranscript, appendTranscript, t]);

    // Detect mic support on web. We use MediaRecorder + getUserMedia (universally
    // supported on modern mobile browsers) rather than Web Speech API (Chrome Android
    // often exposes it but it fails silently; Firefox/Samsung Internet don't expose it
    // at all). If getUserMedia is present we can always record and transcribe server-side.
    useEffect(() => {
        if (Platform.OS === 'web') {
            if (typeof window === 'undefined') return;
            const hasRecorder =
                typeof window.MediaRecorder !== 'undefined'
                && !!navigator?.mediaDevices?.getUserMedia;
            if (!hasRecorder) {
                console.warn('MediaRecorder / getUserMedia not supported on this browser');
                setIsMicSupported(false);
                return;
            }
            setIsMicSupported(true);
            return () => {
                try { webRecognitionRef.current?.abort(); } catch { /* noop */ }
                webRecognitionRef.current = null;
                try {
                    const rec = mediaRecorderRef.current;
                    if (rec && rec.state !== 'inactive') rec.stop();
                } catch { /* noop */ }
                try { mediaStreamRef.current?.getTracks?.().forEach((t) => t.stop()); } catch { /* noop */ }
            };
        }

        // Keep the legacy code path below for native — nothing to initialise for web here.
        // eslint-disable-next-line no-unused-vars
        const _kept = () => null;
    }, []);

    // Native mic: expo-av Recording ref. We record audio locally and upload to
    // /api/transcribe (Groq Whisper) — the same path used on web. This works
    // in Expo Go, custom dev clients, and production builds, so we no longer
    // depend on expo-speech-recognition's native module being available.
    const nativeRecordingRef = useRef(null);
    const nativeAutoStopRef = useRef(null);

    useEffect(() => {
        if (Platform.OS === 'web') return undefined;
        try {
            // Importing expo-av upfront verifies the native module is linked.
            require('expo-av');
            setIsMicSupported(true);
        } catch (error) {
            console.warn('expo-av not available:', error);
            setIsMicSupported(false);
        }
        return () => {
            if (nativeAutoStopRef.current) {
                clearTimeout(nativeAutoStopRef.current);
                nativeAutoStopRef.current = null;
            }
            const rec = nativeRecordingRef.current;
            if (rec) {
                rec.stopAndUnloadAsync().catch(() => { /* noop */ });
                nativeRecordingRef.current = null;
            }
        };
    }, []);


    useEffect(() => {
        const load = async () => {
            const saved = await chatStorage.loadCurrentChat();
            if (saved.length > 0) setMessages(saved);
            const history = await chatStorage.loadAllChats();
            setChatHistory(history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
        };
        load();
    }, []);

    const openHistory = async () => {
        const history = await chatStorage.loadAllChats();
        setChatHistory(history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
        setShowHistory(true);
    };

    const loadChat = (chatItem) => {
        setMessages(chatItem.messages);
        setShowHistory(false);
    };

    useEffect(() => {
        const params = route?.params;
        if (params?.analysisContext && params?.documentName) {
            setAttachedDocument({ name: params.documentName, extractedText: params.analysisContext, isImage: false, uri: null, size: 0 });
            setInput(t('chat.contractHelpPrompt'));
        }
    }, [route?.params, t]);

    useEffect(() => {
        const hasPendingMessages = messages.some((message) => message.isPending);
        const persistedMessages = messages.filter((message) => !message.isPending);
        if (!hasPendingMessages && persistedMessages.length > 0) chatStorage.saveChat(persistedMessages);
    }, [messages]);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => { flatListRef.current?.scrollToEnd({ animated: true }); }, 100);
    }, []);
    useEffect(() => { scrollToBottom(); }, [messages, isLoading]);
    const hasPendingAssistantMessage = messages.some((message) => message.isPending);

    // ── Handlers ──
    const handleAttach = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png', 'image/webp'],
                copyToCacheDirectory: true,
            });
            if (result.canceled) return;
            const file = result.assets[0];
            const isImage = file.mimeType?.startsWith('image/');
            setIsExtracting(true); setError(null);
            setAttachedDocument({ name: file.name, uri: file.uri, type: file.mimeType, size: file.size, isImage, extractedText: null, fileAsset: file });
            try {
                const extractResult = await apiService.extractDocument(file);
                if (!extractResult.success) throw new Error(extractResult.message || t('chat.extractFailed'));
                setAttachedDocument(prev => ({ ...prev, extractedText: extractResult.extracted_text, charCount: extractResult.char_count }));
            } catch (err) {
                setError(t('chat.extractFailed')); setAttachedDocument(null);
                setTimeout(() => setError(null), 3000);
            } finally { setIsExtracting(false); }
        } catch (err) { /* picker cancelled or error */ }
    };

    const assessCameraQuality = (asset) => {
        const w = Number(asset.width) || 0;
        const h = Number(asset.height) || 0;
        const size = Number(asset.fileSize) || 0;
        const issues = [];
        const minDim = Math.min(w, h);
        if (minDim > 0 && minDim < 700) {
            issues.push(`${t('chat.cameraLowResolutionPrefix')} (${w}x${h}) ${t('chat.cameraLowResolutionSuffix')}`);
        }
        if (size > 0 && size < 40 * 1024) {
            issues.push(t('chat.cameraFileTooSmall'));
        }
        return issues;
    };

    const confirmPoorQuality = (issues) => new Promise((resolve) => {
        const joined = issues.join('\n• ');
        if (Platform.OS === 'web') {
            resolve(window.confirm(`Image quality looks poor:\n\n• ${joined}\n\nUse this image anyway?`));
            return;
        }
        Alert.alert(
            t('chat.poorImageTitle'),
            `• ${joined}\n\n${t('chat.poorImageAdvice')}`,
            [
                { text: t('chat.retake'), style: 'cancel', onPress: () => resolve(false) },
                { text: t('chat.useAnyway'), onPress: () => resolve(true) },
            ],
        );
    });

    const handleCamera = async () => {
        try {
            const ImagePicker = require('expo-image-picker');
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') { Alert.alert(t('chat.permissionNeededTitle'), t('chat.cameraPermissionRequired')); return; }
            const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9, exif: false });
            if (result.canceled) return;

            const file = result.assets[0];
            const issues = assessCameraQuality(file);
            if (issues.length) {
                const proceed = await confirmPoorQuality(issues);
                if (!proceed) return;
            }

            setIsExtracting(true); setError(null);
            setAttachedDocument({ name: 'captured_image.jpg', uri: file.uri, type: 'image/jpeg', size: file.fileSize || 0, isImage: true, extractedText: null, fileAsset: file });
            try {
                // Pass the full asset — buildFileFormData handles web (fetch→Blob) vs native (uri).
                const fileToUpload = { ...file, name: 'captured_image.jpg', mimeType: 'image/jpeg' };
                const extractResult = await apiService.extractDocument(fileToUpload);
                if (extractResult.success) {
                    setAttachedDocument(prev => ({ ...prev, extractedText: extractResult.extracted_text }));
                } else {
                    setAttachedDocument(prev => ({ ...prev, extractedText: '[Image attached]' }));
                }
            } catch (err) {
                const detail = err?.message || String(err);
                console.error('Camera extract error:', detail);
                setError(`Failed to process image: ${detail}`);
                setAttachedDocument(null);
                setTimeout(() => setError(null), 5000);
            }
            finally { setIsExtracting(false); }
        } catch { Alert.alert(t('common.error'), t('chat.cameraLaunchFailed')); }
    };

    const handleMic = async () => {
        console.log('handleMic called, isListening:', isListening, 'Platform:', Platform.OS);
        if (Platform.OS === 'web') {
            // HTTPS is required by the browser for getUserMedia + MediaRecorder.
            if (typeof window !== 'undefined' && window.location?.protocol !== 'https:'
                && window.location?.hostname !== 'localhost') {
                Alert.alert(
                    'HTTPS Required',
                    'Voice input requires HTTPS. Please open the app over https://.'
                );
                return;
            }

            // Second tap: stop recording and upload to backend for Whisper transcription.
            if (isListening) {
                const rec = mediaRecorderRef.current;
                if (rec && rec.state !== 'inactive') {
                    try { rec.stop(); } catch (e) { console.warn('recorder stop failed:', e); }
                } else {
                    // Recorder already gone (race condition / cleanup). Force-reset state.
                    setIsListening(false);
                    try { mediaStreamRef.current?.getTracks?.().forEach((t) => t.stop()); } catch { /* noop */ }
                    mediaStreamRef.current = null;
                }
                return;
            }

            // First tap: start MediaRecorder — works on every modern mobile browser.
            if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
                Alert.alert('Voice Not Supported', 'Your browser does not expose a microphone API.');
                return;
            }
            if (typeof window.MediaRecorder === 'undefined') {
                Alert.alert('Voice Not Supported', 'Your browser does not support MediaRecorder. Try a newer Chrome, Safari, or Edge.');
                return;
            }

            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (err) {
                console.error('getUserMedia failed:', err);
                const name = err?.name || '';
                if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
                    Alert.alert('Mic Blocked', 'Microphone permission is blocked. Tap the lock icon in your address bar → Site settings → Microphone → Allow, then reload.');
                } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
                    Alert.alert('No Microphone', 'No microphone was found on this device.');
                } else {
                    Alert.alert('Mic Error', err?.message || String(err));
                }
                return;
            }

            // Pick the best supported MIME type (Chrome: webm/opus, Safari: mp4/aac).
            const candidateTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
            const mimeType = candidateTypes.find((t) => window.MediaRecorder.isTypeSupported?.(t)) || '';
            const recorder = mimeType ? new window.MediaRecorder(stream, { mimeType }) : new window.MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            mediaStreamRef.current = stream;
            mediaChunksRef.current = [];

            recorder.ondataavailable = (evt) => {
                if (evt.data && evt.data.size > 0) mediaChunksRef.current.push(evt.data);
            };
            recorder.onerror = (evt) => {
                console.error('MediaRecorder error:', evt?.error || evt);
            };
            recorder.onstart = () => {
                console.log('[REC] started, mimeType:', recorder.mimeType);
                setIsListening(true);
            };
            recorder.onstop = async () => {
                console.log('[REC] stopped, chunks:', mediaChunksRef.current.length);
                setIsListening(false);
                try { stream.getTracks().forEach((t) => t.stop()); } catch { /* noop */ }
                mediaStreamRef.current = null;

                const blob = new Blob(mediaChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
                mediaChunksRef.current = [];
                if (!blob.size) {
                    Alert.alert('No Audio Captured', 'The mic did not capture any audio. Try again.');
                    return;
                }

                const ext = (recorder.mimeType || 'audio/webm').split(';')[0].split('/')[1] || 'webm';
                const filename = `speech.${ext}`;
                const langCode = language === 'ur' ? 'ur' : 'en';

                setIsExtracting(true);
                try {
                    const result = await apiService.transcribeAudio(blob, { language: langCode, filename });
                    if (result?.transcript) {
                        appendTranscript(result.transcript);
                    } else {
                        Alert.alert('No Speech Detected', 'The mic did not catch any intelligible speech. Try again in a quieter place.');
                    }
                } catch (err) {
                    console.error('transcribe failed:', err);
                    Alert.alert('Transcription Failed', err?.message || String(err));
                } finally {
                    setIsExtracting(false);
                }
            };

            try {
                recorder.start();
                // Auto-stop after 60s so users can't leave the mic running indefinitely.
                setTimeout(() => {
                    if (recorder.state === 'recording') {
                        try { recorder.stop(); } catch { /* noop */ }
                    }
                }, 60000);
            } catch (err) {
                console.error('recorder.start failed:', err);
                setIsListening(false);
                try { stream.getTracks().forEach((t) => t.stop()); } catch { /* noop */ }
                Alert.alert('Mic Error', err?.message || String(err));
            }
            return;
        }

        // Native: record with expo-av, upload to /api/transcribe (same as web).
        const { Audio } = require('expo-av');
        const langCode = language === 'ur' ? 'ur' : 'en';

        // Second tap → stop, upload, append transcript.
        if (isListening) {
            const rec = nativeRecordingRef.current;
            if (!rec) {
                setIsListening(false);
                return;
            }
            if (nativeAutoStopRef.current) {
                clearTimeout(nativeAutoStopRef.current);
                nativeAutoStopRef.current = null;
            }
            try {
                await rec.stopAndUnloadAsync();
            } catch (err) {
                console.warn('stopAndUnloadAsync failed:', err);
            }
            setIsListening(false);
            const uri = rec.getURI?.();
            nativeRecordingRef.current = null;
            try {
                await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
            } catch { /* noop */ }

            if (!uri) {
                Alert.alert('No Audio Captured', 'The mic did not capture any audio. Try again.');
                return;
            }

            setIsExtracting(true);
            try {
                const mimeType = Platform.OS === 'ios' ? 'audio/mp4' : 'audio/m4a';
                const filename = Platform.OS === 'ios' ? 'speech.m4a' : 'speech.m4a';
                const fileAsset = { uri, name: filename, mimeType, type: mimeType };
                const result = await apiService.transcribeAudioFile(fileAsset, { language: langCode });
                if (result?.transcript) {
                    appendTranscript(result.transcript);
                } else {
                    Alert.alert('No Speech Detected', 'The mic did not catch any intelligible speech. Try again in a quieter place.');
                }
            } catch (err) {
                console.error('transcribe failed:', err);
                Alert.alert('Transcription Failed', err?.message || String(err));
            } finally {
                setIsExtracting(false);
            }
            return;
        }

        // First tap → request permission, start recording.
        try {
            const perm = await Audio.requestPermissionsAsync();
            if (!perm?.granted) {
                Alert.alert(
                    t('chat.voicePermissionTitle') || 'Microphone Permission',
                    'Enable microphone access for LegalEase in your device settings, then try again.'
                );
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            nativeRecordingRef.current = recording;
            setIsListening(true);

            // Auto-stop after 60s so users can't leave the mic running indefinitely.
            nativeAutoStopRef.current = setTimeout(() => {
                if (nativeRecordingRef.current) {
                    handleMic();
                }
            }, 60000);
        } catch (err) {
            console.error('startAsync failed:', err);
            setIsListening(false);
            nativeRecordingRef.current = null;
            Alert.alert(t('chat.voiceUnavailableTitle') || 'Mic Error', err?.message || String(err));
        }
    };

    const stopListening = () => {
        if (Platform.OS === 'web') {
            // Stop MediaRecorder if running (primary path on web).
            const rec = mediaRecorderRef.current;
            if (rec && rec.state !== 'inactive') {
                try { rec.stop(); } catch { /* onstop handler clears isListening */ }
                return;
            }
            // Stop legacy Web Speech API instance if one is still around.
            commitSpeechDraft();
            try { webRecognitionRef.current?.stop(); } catch { setIsListening(false); }
            return;
        }
        // Native: expo-av recording. Delegate to handleMic so the same stop-and-
        // upload path runs (ensures we always get a transcript round-trip).
        if (nativeRecordingRef.current) {
            handleMic();
        } else {
            setIsListening(false);
        }
    };

    const handleSend = async (overrideText) => {
        if (isLoading || isExtracting) return;
        const text = (overrideText || input).trim() || (attachedDocument ? t('chat.analyzeDocumentPrompt') : '');
        if (!text && !attachedDocument) return;
        setIsLoading(true); setError(null);
        const doc = attachedDocument;
        const userMessageId = `${Date.now()}-user`;
        const assistantMessageId = `${Date.now() + 1}-ai`;
        const userMessage = {
            role: 'user', content: text,
            hasAttachment: !!doc, attachmentName: doc?.name, attachmentIsImage: doc?.isImage,
            timestamp: new Date().toISOString(), id: userMessageId,
        };
        const pendingAssistant = {
            role: 'assistant', content: '', isPending: true,
            timestamp: new Date().toISOString(), id: assistantMessageId, sources: [],
        };

        setMessages(prev => [...prev, userMessage, pendingAssistant]);
        setInput('');
        setAttachedDocument(null);

        try {
            const response = await apiService.sendChatMessage(text, [...messages, userMessage], doc?.extractedText || null, doc?.name || null);
            setMessages(prev => prev.map(message => {
                if (message.id !== assistantMessageId) return message;
                return { ...message, content: response.response || t('chat.fallbackResponse'), sources: response.sources || [], isPending: false, isRefusal: Boolean(response.refusal_reason), refusalReason: response.refusal_reason || null, timestamp: new Date().toISOString() };
            }));
        } catch (err) {
            setMessages(prev => prev.map(message => {
                if (message.id !== assistantMessageId) return message;
                return { ...message, content: err.message || t('chat.error'), isPending: false, isError: true, sources: [], timestamp: new Date().toISOString() };
            }));
            setError(err.message || t('chat.error'));
            setTimeout(() => setError(null), 6000);
        } finally { setIsLoading(false); }
    };

    const handleClearChat = () => {
        const doClear = () => { setMessages([]); chatStorage.clearCurrentChat(); };
        if (Platform.OS === 'web') { if (window.confirm(t('chat.clearConfirmMessage'))) doClear(); }
        else Alert.alert(t('chat.newChatTitle'), t('chat.clearConfirmMessage'), [{ text: t('common.cancel'), style: 'cancel' }, { text: t('chat.clear'), style: 'destructive', onPress: doClear }]);
    };

    // ── Empty state — clean, scrollable, mobile-friendly ──
    const renderEmpty = () => (
        <FlatList
            style={st.listFlex}
            data={[]}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
                <View style={st.empty}>
                    {/* Hero */}
                    <Animated.View style={[st.heroWrap, { opacity: heroOpacity, transform: [{ scale: heroScale }] }]}>
                        <LawLogo size={isSmall ? 44 : 52} />
                        <Text style={[st.greeting, isSmall && { fontSize: 24, lineHeight: 30 }]}>
                            LegalEase — Pakistani Law, in Plain Language
                        </Text>
                        <Text style={st.greetingSub}>
                            I help non-lawyer Pakistani citizens understand the law in seven specific areas.{'\n'}I explain what the law says, what to do next, and where to find the official source. I&apos;m not a substitute for a lawyer.
                        </Text>
                        <View style={st.scopeChips}>
                            {['Criminal', 'Civil', 'Family', 'Police', 'Land & Property', 'Religious', 'Banking & Financial', '1973 Constitution'].map((label) => (
                                <Text key={label} style={st.scopeChip}>{label}</Text>
                            ))}
                        </View>
                    </Animated.View>

                    <FadeInView delay={180} distance={16}>
                        <View style={st.metricsRow}>
                            {trustMetrics.map((item) => (
                                <View key={item.label} style={st.metricPill}>
                                    <Ionicons name={item.icon} size={13} color={colors.accentPrimary} />
                                    <View style={st.metricTextWrap}>
                                        <Text style={st.metricLabel}>{item.label}</Text>
                                        <Text style={st.metricValue}>{item.value}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </FadeInView>

                    {/* Suggestion cards — 2x2 grid */}
                    <FadeInView delay={300} distance={20}>
                        <View style={st.cardGrid}>
                            {suggestions.map((s, i) => (
                                <AnimatedPressable
                                    key={i}
                                    style={[st.card, { width: cardWidth }]}
                                    onPress={() => handleSend(s.prompt)}
                                    scaleValue={0.95}
                                    disabled={isLoading || isExtracting}
                                >
                                    <LinearGradient colors={s.bg} style={st.cardGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                        <Ionicons name={s.icon} size={18} color="rgba(255,255,255,0.9)" />
                                    </LinearGradient>
                                    <Text style={st.cardTitle}>{s.title}</Text>
                                    <Text style={st.cardDesc}>{s.desc}</Text>
                                </AnimatedPressable>
                            ))}
                        </View>
                    </FadeInView>

                    {/* Quick actions */}
                    <FadeInView delay={500} distance={12}>
                        <View style={st.actionRow}>
                            <AnimatedPressable style={st.actionBtn} onPress={handleAttach} scaleValue={0.95} disabled={isLoading || isExtracting}>
                                <Ionicons name="attach" size={15} color={colors.accentPrimary} />
                                <Text style={st.actionLabel}>{t('chat.uploadDocument')}</Text>
                            </AnimatedPressable>
                            <AnimatedPressable style={st.actionBtn} onPress={handleCamera} scaleValue={0.95} disabled={isLoading || isExtracting}>
                                <Ionicons name="scan-outline" size={15} color={colors.accentPrimary} />
                                <Text style={st.actionLabel}>{t('chat.scanDocument')}</Text>
                            </AnimatedPressable>
                        </View>
                    </FadeInView>
                </View>
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        />
    );

    // ── Chat History Modal ──
    const renderHistoryModal = () => (
        <Modal visible={showHistory} animationType="slide" transparent={false} onRequestClose={() => setShowHistory(false)}>
            <SafeAreaView style={st.modalRoot}>
                <View style={st.modalHeader}>
                    <Text style={st.modalTitle}>{t('chat.historyTitle')}</Text>
                    <AnimatedPressable onPress={() => setShowHistory(false)} scaleValue={0.9} style={st.modalCloseBtn}>
                        <Ionicons name="close" size={24} color={colors.textPrimary} />
                    </AnimatedPressable>
                </View>
                <FlatList
                    data={chatHistory}
                    keyExtractor={(it) => it.id?.toString()}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    ListEmptyComponent={
                        <View style={st.historyEmptyWrap}>
                            <Ionicons name="chatbubbles-outline" size={48} color={colors.textTertiary} />
                            <Text style={st.historyEmpty}>{t('chat.historyEmpty')}</Text>
                            <Text style={st.historyEmptySub}>{t('chat.historyEmptySub')}</Text>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const firstMsg = item.messages[0]?.content || t('chat.emptyChat');
                        const locale = language === 'ur' ? 'ur-PK' : 'en-US';
                        const timeStr = new Date(item.timestamp).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
                        return (
                            <AnimatedPressable style={st.historyCard} onPress={() => loadChat(item)} scaleValue={0.97}>
                                <View style={st.historyIconWrap}>
                                    <Ionicons name="chatbubble-outline" size={18} color={colors.accentPrimary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={st.historyText} numberOfLines={2}>{firstMsg}</Text>
                                    <Text style={st.historyTime}>{timeStr} · {item.messages.length} {t('chat.messages')}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                            </AnimatedPressable>
                        );
                    }}
                />
            </SafeAreaView>
        </Modal>
    );

    return (
        <KeyboardAvoidingView
            style={st.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            {/* Header */}
            <View style={st.header}>
                <View style={st.headerLeft}>
                    <AnimatedPressable style={st.menuBtn} onPress={openHistory} scaleValue={0.9}>
                        <Ionicons name="time-outline" size={22} color={colors.textPrimary} />
                    </AnimatedPressable>
                    <LawLogo size={30} />
                    <View style={{ flexShrink: 1 }}>
                        <Text style={st.headerTitle} numberOfLines={1}>LegalEase</Text>
                        <View style={st.statusRow}>
                            <View style={st.statusDot} />
                            <Text style={st.statusText} numberOfLines={1}>{t('chat.aiCounsel')}</Text>
                        </View>
                    </View>
                </View>
                {messages.length > 0 && (
                    <AnimatedPressable style={st.headerBtn} onPress={handleClearChat} scaleValue={0.9}>
                        <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
                    </AnimatedPressable>
                )}
            </View>

            {/* Error */}
            {error && (
                <TouchableOpacity style={st.errorBar} onPress={() => setError(null)} activeOpacity={0.8}>
                    <Ionicons name="alert-circle" size={16} color={colors.error} />
                    <Text style={st.errorText} numberOfLines={2}>{error}</Text>
                    <Ionicons name="close" size={14} color={colors.textTertiary} />
                </TouchableOpacity>
            )}

            {/* Messages or empty */}
            <View style={st.chatBody}>
                {messages.length === 0 ? renderEmpty() : (
                    <FlatList
                        ref={flatListRef}
                        style={st.listFlex}
                        data={messages}
                        keyboardShouldPersistTaps="handled"
                        keyExtractor={(item) => item.id || `${item.role}-${item.timestamp}`}
                        renderItem={({ item }) => <ChatMessage message={item} />}
                        contentContainerStyle={st.msgList}
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={scrollToBottom}
                        ListFooterComponent={isLoading && !hasPendingAssistantMessage ? (
                            <View style={st.loadingRow}>
                                <View style={st.loadingBubble}>
                                    <ShimmerLoader lines={3} />
                                    <Text style={st.loadingLabel}>{attachedDocument ? t('chat.analyzingDocument') : t('chat.researching')}</Text>
                                </View>
                            </View>
                        ) : null}
                    />
                )}
            </View>

            <View style={[st.composerDock, { paddingBottom: composerOffset }]}> 
                {messages.length > 0 && !attachedDocument && !input.trim() && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={st.quickRow}
                    >
                        {quickPrompts.map((item) => (
                            <AnimatedPressable
                                key={item.id}
                                style={st.quickChip}
                                scaleValue={0.96}
                                onPress={() => handleSend(item.prompt)}
                                disabled={isLoading || isExtracting}
                            >
                                <Ionicons name={item.icon} size={14} color={colors.accentPrimary} />
                                <Text style={st.quickChipText}>{item.label}</Text>
                            </AnimatedPressable>
                        ))}
                    </ScrollView>
                )}

                {/* Attachment preview */}
                {attachedDocument && (
                    <View style={st.attachBar}>
                        <Ionicons
                            name={attachedDocument.type?.startsWith('audio') ? 'mic' : attachedDocument.isImage ? 'image' : 'document-text'}
                            size={14} color={colors.accentPrimary}
                        />
                        <Text style={st.attachName} numberOfLines={1}>{attachedDocument.name}</Text>
                        <Text style={st.attachStatus}>{isExtracting ? t('chat.processing') : attachedDocument.extractedText ? t('chat.ready') : t('chat.uploading')}</Text>
                        <TouchableOpacity onPress={() => setAttachedDocument(null)} disabled={isExtracting} hitSlop={10}>
                            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                    </View>
                )}

                <InputBar
                    value={input} onChangeText={setInput} onSend={handleSend}
                    onAttach={handleAttach} onCamera={handleCamera} onMic={handleMic}
                    isLoading={isLoading} isExtracting={isExtracting} hasAttachment={!!attachedDocument}
                    isRecording={false} recordingDuration={0}
                    isListening={isListening}
                    isMicSupported={isMicSupported}
                    placeholderText={t('chat.placeholder')}
                    listeningText={t('chat.listeningHint')}
                    attachSheetTitle={t('chat.attachSheetTitle')}
                    attachOptionDocument={t('chat.attachChooseDocument')}
                    attachOptionCamera={t('chat.attachTakePhoto')}
                    cancelLabel={t('common.cancel')}
                    onStopRecording={stopListening} onCancelRecording={stopListening}
                />
            </View>

            {/* History Modal */}
            {renderHistoryModal()}
        </KeyboardAvoidingView>
    );
};

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgPrimary },
    chatBody: { flex: 1, minHeight: 0 },
    listFlex: { flex: 1 },
    composerDock: { backgroundColor: colors.bgPrimary },
    quickRow: {
        paddingHorizontal: 14,
        paddingTop: 6,
        paddingBottom: 4,
        gap: 8,
    },
    quickChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: colors.bgSecondary,
        borderWidth: 1,
        borderColor: colors.borderColor,
    },
    quickChipText: {
        color: colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 10,
        backgroundColor: colors.bgSecondary,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderColor,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
    headerTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
    statusText: { color: colors.textTertiary, fontSize: 10, fontWeight: '500' },
    headerBtn: {
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: colors.bgTertiary, borderWidth: 1, borderColor: colors.borderMid,
        alignItems: 'center', justifyContent: 'center',
    },

    // Error
    errorBar: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginHorizontal: 16, marginTop: 8, padding: 12,
        backgroundColor: colors.errorMuted, borderRadius: 12,
        borderWidth: 1, borderColor: colors.errorBorder,
    },
    errorText: { color: colors.error, fontSize: 13, flex: 1 },

    // Empty
    empty: { paddingHorizontal: 20, paddingVertical: 16 },

    // Hero
    heroWrap: { alignItems: 'center', marginBottom: 24, gap: 10 },
    greeting: { fontSize: 28, fontWeight: '800', letterSpacing: -1, color: colors.textPrimary, textAlign: 'center', lineHeight: 36 },
    greetingSub: { color: colors.textTertiary, fontSize: 13, textAlign: 'center', lineHeight: 20, maxWidth: 280 },

    // Trust metrics
    metricsRow: { gap: 6, marginBottom: 16 },
    metricPill: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: colors.bgSecondary,
        borderWidth: 1, borderColor: colors.borderColor,
        borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7,
    },
    metricTextWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metricLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
    metricValue: { color: colors.textPrimary, fontSize: 11, fontWeight: '700' },

    // Card grid — 2x2
    cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
    card: {
        backgroundColor: colors.bgSecondary,
        borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.borderColor,
        gap: 4,
    },
    cardGrad: {
        width: 32, height: 32, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center',
    },
    cardTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '600', marginTop: 2 },
    cardDesc: { color: colors.textTertiary, fontSize: 10, lineHeight: 15 },

    // Actions
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    actionBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
        paddingVertical: 10, backgroundColor: colors.bgSecondary, borderRadius: 10,
        borderWidth: 1, borderColor: colors.borderColor,
    },
    actionLabel: { color: colors.accentPrimary, fontSize: 12, fontWeight: '600' },

    // Messages
    msgList: { paddingTop: 8, paddingBottom: 16 },

    // Loading
    loadingRow: { paddingHorizontal: 16, paddingVertical: 6 },
    loadingBubble: {
        backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.borderColor,
        borderRadius: 16, borderBottomLeftRadius: 4,
        paddingHorizontal: 16, paddingVertical: 14, maxWidth: '80%', gap: 8,
    },
    loadingLabel: { color: colors.textTertiary, fontSize: 12 },

    // Attachment
    attachBar: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginHorizontal: 16, marginBottom: 6,
        backgroundColor: colors.bgSecondary, borderRadius: 12,
        borderWidth: 1, borderColor: colors.borderMid,
        paddingHorizontal: 14, paddingVertical: 10,
    },
    attachName: { flex: 1, color: colors.textPrimary, fontSize: 13, fontWeight: '500' },
    attachStatus: { color: colors.textTertiary, fontSize: 11 },

    menuBtn: {
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: colors.bgTertiary, borderWidth: 1, borderColor: colors.borderMid,
        alignItems: 'center', justifyContent: 'center',
    },

    // History Modal
    modalRoot: { flex: 1, backgroundColor: colors.bgPrimary },
    modalHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 16,
        borderBottomWidth: 1, borderBottomColor: colors.borderColor,
        backgroundColor: colors.bgSecondary,
    },
    modalTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
    modalCloseBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: colors.bgTertiary,
        alignItems: 'center', justifyContent: 'center',
    },
    historyEmptyWrap: { alignItems: 'center', marginTop: 80, gap: 8 },
    historyEmpty: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
    historyEmptySub: { color: colors.textTertiary, fontSize: 13 },
    historyCard: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        padding: 16, marginBottom: 10,
        backgroundColor: colors.bgSecondary,
        borderRadius: 16, borderWidth: 1, borderColor: colors.borderColor,
    },
    historyIconWrap: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: colors.accentMuted,
        alignItems: 'center', justifyContent: 'center',
    },
    historyText: { color: colors.textPrimary, fontSize: 14, fontWeight: '500', lineHeight: 20 },
    historyTime: { color: colors.textTertiary, fontSize: 12, marginTop: 4 },

    // Scope chips (empty-state domain pills)
    scopeChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        justifyContent: 'center',
        marginTop: 12,
        maxWidth: 360,
        alignSelf: 'center',
    },
    scopeChip: {
        fontSize: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: colors.bgSecondary,
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: colors.borderColor,
        overflow: 'hidden',
    },
});

export default ChatScreen;
