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
                className="flex-1"
            >
                <TouchableWithoutFeedback onPress={onClose}>
                    <View className="flex-1 justify-end" style={[{ backgroundColor: theme.overlay }]}>
                        <TouchableWithoutFeedback>
                            <Animated.View
                                style={[
                                    {
                                        width: '100%',
                                        borderTopLeftRadius: 20,
                                        borderTopRightRadius: 20,
                                        borderTopWidth: 1,
                                        overflow: 'hidden',
                                        shadowColor: "#000",
                                        shadowOffset: { width: 0, height: -3 },
                                        shadowOpacity: 0.2,
                                        shadowRadius: 4,
                                        elevation: 5,
                                        backgroundColor: theme.bg,
                                        transform: [{ translateY: slideAnim }],
                                        height: height as any,
                                        borderTopColor: theme.border,
                                    },
                                ]}
                            >
                                {/* Header */}
                                <View className="flex-row items-center justify-between px-5 py-4 border-b" style={[{ borderBottomColor: theme.border }]}>
                                    <View className="flex-1">
                                        {title && (
                                            <Text className="text-[18px] font-bold" style={[{ color: theme.text }]}>
                                                {title}
                                            </Text>
                                        )}
                                    </View>
                                    <Pressable onPress={onClose} className="p-1">
                                        <X size={24} color={theme.text} />
                                    </Pressable>
                                </View>

                                {/* Body */}
                                <View className="flex-1" style={[noPadding ? { padding: 0 } : { padding: 20 }]}>
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


