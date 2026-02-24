import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type LoginScreenProps = {
    onLogin: (email: string, password: string) => Promise<void>;
    isLoading: boolean;
    error: string;
};

export default function LoginScreen({ onLogin, isLoading, error }: LoginScreenProps) {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isHovering, setIsHovering] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [validationError, setValidationError] = React.useState('');
    const [isKeyboardVisible, setIsKeyboardVisible] = React.useState(false);
    const scrollViewRef = React.useRef<ScrollView>(null);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    React.useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, () => {
            setIsKeyboardVisible(true);
            // Scroll to bottom to show login button
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setIsKeyboardVisible(false);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const theme = {
        bg: isDark ? '#000' : '#fff',
        card: isDark ? '#111' : '#f5f5f5',
        border: isDark ? '#333' : '#ddd',
        text: isDark ? '#fff' : '#111',
        textSecondary: isDark ? '#999' : '#666',
        view: isDark ? '#999' : '#666',
        placeholder: isDark ? '#666' : '#aaa',
        buttonBg: isDark ? '#fff' : '#111',
        buttonText: isDark ? '#000' : '#fff',
        logoBg: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        forgotHover: isDark ? "#fff" : "#000",


    };

    const displayError = validationError || error;

    const handleSubmit = () => {
        setValidationError('');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email.trim()) {
            setValidationError('Please enter your email.');
            return;
        }
        if (!emailRegex.test(email)) {
            setValidationError('Please enter a valid email (e.g. name@example.com).');
            return;
        }
        if (password.length < 6) {
            setValidationError('Password must be at least 6 characters.');
            return;
        }

        // Validation passed — call the auth handler
        onLogin(email, password);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Top Bar - Acme Inc. */}
                    <View style={styles.topBar} className="justify-center">
                        <View style={[styles.logoBox, { backgroundColor: theme.logoBg }]}>
                            <Text style={[styles.logoText, { color: theme.text }]}>⌘</Text>
                        </View>
                        <Text style={[styles.brandName, { color: theme.text }]}>Acme Inc.</Text>
                    </View>

                    {/* Title Section */}
                    <View style={[{ paddingTop: isKeyboardVisible ? 10 : 80, alignItems: 'center' }]}>
                        <View style={{ width: '100%', maxWidth: 450 }}>
                            <View style={styles.titleSection}>
                                <Text style={[styles.title, { color: theme.text }]}>
                                    Login to your account
                                </Text>
                                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                                    Enter your email below{'\n'}to login to your account
                                </Text>
                            </View>

                            {/* Form */}
                            <View style={styles.form}>
                                {/* Email */}
                                <Text style={[styles.label, { color: theme.text }]}>Email</Text>
                                <TextInput
                                    placeholder="m@example.com"
                                    placeholderTextColor={theme.placeholder}
                                    keyboardType="email-address"
                                    textContentType="emailAddress"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                    editable={!isLoading}
                                    style={[styles.input, {
                                        color: theme.text,
                                        borderColor: theme.border,
                                        backgroundColor: theme.card,
                                    }]}
                                />

                                {/* Password label + Forgot link */}
                                <View style={styles.passwordRow}>
                                    <Text style={[styles.label, { color: theme.text, marginBottom: 0 }]}>Password</Text>
                                    <Pressable
                                        onPress={() => { }}
                                        onPressIn={() => setIsHovering(true)}
                                        onPressOut={() => setIsHovering(false)}
                                    >
                                        <Text
                                            style={[
                                                styles.forgotText,
                                                {
                                                    color: isHovering ? theme.forgotHover : theme.textSecondary,
                                                    textDecorationLine: isHovering ? "underline" : "none",
                                                },
                                            ]}
                                        >
                                            Forgot your password?
                                        </Text>
                                    </Pressable>


                                </View>

                                {/* Password Input with toggle */}
                                <View style={{ position: 'relative' }}>
                                    <TextInput
                                        secureTextEntry={!showPassword}
                                        placeholder=""
                                        placeholderTextColor={theme.placeholder}
                                        value={password}
                                        onChangeText={setPassword}
                                        editable={!isLoading}
                                        style={[styles.input, {
                                            color: theme.text,
                                            borderColor: displayError ? '#ef4444' : theme.border,
                                            backgroundColor: theme.card,
                                        }]}
                                    />
                                    <Pressable
                                        onPress={() => setShowPassword(!showPassword)}
                                        style={styles.eyeButton}
                                    >
                                        <MaterialIcons
                                            name={showPassword ? 'visibility' : 'visibility-off'}
                                            size={20}
                                            color={theme.textSecondary}
                                        />
                                    </Pressable>
                                </View>

                                {/* Error message */}
                                {!!displayError && (
                                    <Text style={styles.errorText}>{displayError}</Text>
                                )}
                            </View>

                            {/* Login Button */}
                            <View style={styles.buttonContainer} className="pt-8">
                                <Pressable
                                    onPress={handleSubmit}
                                    disabled={isLoading}
                                    style={[styles.loginButton, {
                                        backgroundColor: theme.buttonBg,
                                        opacity: isLoading ? 0.6 : 1,
                                    }]}
                                >
                                    <Text style={[styles.loginButtonText, { color: theme.buttonText }]}>
                                        {isLoading ? 'Logging in...' : 'Login'}
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 4,
    },
    logoBox: {
        width: 32,
        height: 32,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    logoText: {
        fontSize: 14,
    },
    brandName: {
        fontSize: 16,
        fontWeight: '600',
    },
    titleSection: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 8,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    form: {
        paddingHorizontal: 24,
        paddingTop: 32,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        marginBottom: 16,
    },
    passwordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    forgotText: {
        fontSize: 12,
    },
    eyeButton: {
        position: 'absolute',
        right: 12,
        top: 0,
        bottom: 16,
        justifyContent: 'center',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 13,
        marginTop: -8,
        marginBottom: 8,
    },
    buttonContainer: {
        paddingHorizontal: 24,
        marginTop: 8,
    },
    loginButton: {
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginButtonText: {
        fontWeight: '600',
        fontSize: 16,
    },
});
