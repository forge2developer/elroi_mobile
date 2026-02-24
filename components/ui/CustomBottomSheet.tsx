import { useColorScheme } from '@/hooks/use-color-scheme';
import { X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    height?: number | string;
    noPadding?: boolean;
};

export default function CustomBottomSheet({
    isOpen,
    onClose,
    title,
    children,
    height = '50%',
    noPadding = false,
}: Props) {
    const isDark = useColorScheme() === 'dark';
    const screenHeight = Dimensions.get('window').height;
    const slideAnim = useRef(new Animated.Value(screenHeight)).current;
    const [isVisible, setIsVisible] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: screenHeight,
                duration: 250,
                useNativeDriver: true,
            }).start(() => setIsVisible(false));
        }
    }, [isOpen]);

    if (!isVisible) return null;

    const theme = {
        bg: isDark ? '#111' : '#fff',
        text: isDark ? '#fff' : '#000',
        bar: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        overlay: 'rgba(0,0,0,0.5)',
        border: isDark ? '#333' : '#eee',
    };

    return (
        <Modal
            transparent
            visible={isVisible}
            animationType="none"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
            >
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
                        <TouchableWithoutFeedback>
                            <Animated.View
                                style={[
                                    styles.sheetContent,
                                    {
                                        backgroundColor: theme.bg,
                                        transform: [{ translateY: slideAnim }],
                                        height: height as any,
                                        borderTopColor: theme.border,
                                    },
                                ]}
                            >
                                {/* Header */}
                                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                                    <View style={styles.headerLeft}>
                                        {title && (
                                            <Text style={[styles.title, { color: theme.text }]}>
                                                {title}
                                            </Text>
                                        )}
                                    </View>
                                    <Pressable onPress={onClose} style={styles.closeBtn}>
                                        <X size={24} color={theme.text} />
                                    </Pressable>
                                </View>

                                {/* Body */}
                                <View style={[styles.body, noPadding && { padding: 0 }]}>
                                    {children}
                                </View>
                            </Animated.View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView >
        </Modal >
    );
}

const styles = StyleSheet.create({
    keyboardView: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    sheetContent: {
        width: '100%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderTopWidth: 1,
        overflow: 'hidden',
        // Shadow
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -3,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerLeft: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    closeBtn: {
        padding: 4,
    },
    body: {
        flex: 1,
        padding: 20,
    },
});
