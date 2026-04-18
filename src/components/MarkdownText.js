// MarkdownText v2 — improved legal markdown renderer
// Better headings, code blocks, blockquotes, refined typography
import React from 'react';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { colors, spacing } from '../constants/theme';

const parseInline = (text, keyPrefix) => {
    if (!text) return null;
    const segments = [];
    const regex = /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;
    let lastIndex = 0;
    let i = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            segments.push(text.slice(lastIndex, match.index));
        }
        if (match[1] !== undefined) {
            segments.push(
                <Text key={`${keyPrefix}-b${i++}`} style={inlineStyles.bold}>
                    {match[1]}
                </Text>
            );
        } else if (match[2] !== undefined) {
            segments.push(
                <Text key={`${keyPrefix}-i${i++}`} style={inlineStyles.italic}>
                    {match[2]}
                </Text>
            );
        } else if (match[3] !== undefined) {
            segments.push(
                <Text key={`${keyPrefix}-c${i++}`} style={inlineStyles.inlineCode}>
                    {' '}{match[3]}{' '}
                </Text>
            );
        }
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        segments.push(text.slice(lastIndex));
    }

    return segments.length > 0 ? segments : text;
};

const MarkdownText = ({ content, baseColor }) => {
    if (!content) return null;

    const textColor = baseColor || colors.textPrimary;
    const lines = content.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
        const raw = lines[i];
        const line = raw.trimEnd();

        // Empty line → spacer
        if (!line.trim()) {
            if (elements.length > 0) {
                elements.push(<View key={`sp-${i}`} style={s.spacer} />);
            }
            i++;
            continue;
        }

        // Blockquote
        if (line.startsWith('> ')) {
            elements.push(
                <View key={`bq-${i}`} style={s.blockquote}>
                    <View style={s.blockquoteBar} />
                    <Text style={[s.body, { color: colors.textSecondary, fontStyle: 'italic', flex: 1 }]}>
                        {parseInline(line.slice(2), `bq-${i}`)}
                    </Text>
                </View>
            );
        }
        // # H1
        else if (line.startsWith('# ')) {
            elements.push(
                <Text key={`h1-${i}`} style={[s.h1, { color: textColor }]}>
                    {parseInline(line.slice(2), `h1-${i}`)}
                </Text>
            );
        }
        // ## H2
        else if (line.startsWith('## ')) {
            elements.push(
                <Text key={`h2-${i}`} style={[s.h2, { color: textColor }]}>
                    {parseInline(line.slice(3), `h2-${i}`)}
                </Text>
            );
        }
        // ### H3
        else if (line.startsWith('### ')) {
            elements.push(
                <Text key={`h3-${i}`} style={[s.h3, { color: textColor }]}>
                    {parseInline(line.slice(4), `h3-${i}`)}
                </Text>
            );
        }
        // Bullet list
        else if (/^[-*•] /.test(line)) {
            const content = line.slice(2);
            elements.push(
                <View key={`li-${i}`} style={s.listItem}>
                    <View style={s.bullet} />
                    <Text style={[s.body, { color: textColor, flex: 1 }]}>
                        {parseInline(content, `li-${i}`)}
                    </Text>
                </View>
            );
        }
        // Numbered list
        else if (/^\d+\.\s/.test(line)) {
            const numMatch = line.match(/^(\d+)\.\s(.*)/);
            if (numMatch) {
                elements.push(
                    <View key={`nl-${i}`} style={s.listItem}>
                        <View style={s.numBadge}>
                            <Text style={s.numLabel}>{numMatch[1]}</Text>
                        </View>
                        <Text style={[s.body, { color: textColor, flex: 1 }]}>
                            {parseInline(numMatch[2], `nl-${i}`)}
                        </Text>
                    </View>
                );
            }
        }
        // Horizontal rule
        else if (/^[-─]{3,}$/.test(line.trim())) {
            elements.push(<View key={`hr-${i}`} style={s.hr} />);
        }
        // Regular paragraph
        else {
            elements.push(
                <Text key={`p-${i}`} style={[s.body, { color: textColor }]}>
                    {parseInline(line, `p-${i}`)}
                </Text>
            );
        }

        i++;
    }

    return <View style={s.container}>{elements}</View>;
};

const inlineStyles = StyleSheet.create({
    bold: { fontWeight: '700' },
    italic: { fontStyle: 'italic' },
    inlineCode: {
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 13,
        backgroundColor: colors.bgTertiary,
        color: colors.accentPrimary,
        borderRadius: 4,
        overflow: 'hidden',
    },
});

const s = StyleSheet.create({
    container: { gap: 3 },
    h1: {
        fontSize: 18, fontWeight: '700', letterSpacing: -0.3,
        lineHeight: 26, marginTop: spacing.md, marginBottom: 4,
    },
    h2: {
        fontSize: 16, fontWeight: '700', letterSpacing: -0.2,
        lineHeight: 24, marginTop: spacing.sm, marginBottom: 3,
    },
    h3: {
        fontSize: 15, fontWeight: '600', lineHeight: 22,
        marginTop: 6, marginBottom: 2,
    },
    body: { fontSize: 15, lineHeight: 24, fontWeight: '400' },
    listItem: {
        flexDirection: 'row', alignItems: 'flex-start',
        gap: spacing.sm, marginVertical: 2,
    },
    bullet: {
        width: 5, height: 5, borderRadius: 3,
        backgroundColor: colors.accentPrimary, opacity: 0.7,
        marginTop: 10, flexShrink: 0,
    },
    numBadge: {
        width: 20, height: 20, borderRadius: 6,
        backgroundColor: colors.accentMuted,
        alignItems: 'center', justifyContent: 'center',
        marginTop: 3, flexShrink: 0,
    },
    numLabel: {
        fontSize: 11, fontWeight: '700', color: colors.accentPrimary,
    },
    spacer: { height: spacing.sm },
    hr: {
        height: 1, backgroundColor: colors.borderColor,
        marginVertical: spacing.md,
    },
    blockquote: {
        flexDirection: 'row', gap: spacing.sm,
        marginVertical: 4,
    },
    blockquoteBar: {
        width: 3, borderRadius: 2,
        backgroundColor: colors.accentPrimary, opacity: 0.4,
        flexShrink: 0,
    },
});

export default MarkdownText;
