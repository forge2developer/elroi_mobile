import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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

        const submitEmail = email.trim();
        const submitPassword = password.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!submitEmail) {
            setValidationError('Please enter your email.');
            return;
        }
        if (!emailRegex.test(submitEmail)) {
            setValidationError('Please enter a valid email (e.g. name@example.com).');
            return;
        }
        if (submitPassword.length < 6) {
            setValidationError('Password must be at least 6 characters.');
            return;
        }

        // Validation passed — call the auth handler
        onLogin(submitEmail, submitPassword);
    };

    return (
        <SafeAreaView className="flex-1" style={[{ backgroundColor: theme.bg }]}>
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Top Bar - Acme Inc. */}
                    <View className="flex-row items-center justify-center px-6 pt-2 pb-1">
                        <View className="w-8 h-8 rounded-lg items-center justify-center mr-2" style={[{ backgroundColor: theme.logoBg }]}>
                            <Text className="text-[14px]" style={[{ color: theme.text }]}>⌘</Text>
                        </View>
                        <Text className="text-[16px] font-semibold" style={[{ color: theme.text }]}>Acme Inc.</Text>
                    </View>

                    {/* Title Section */}
                    <View style={[{ paddingTop: isKeyboardVisible ? 10 : 80, alignItems: 'center' }]}>
                        <View style={{ width: '100%', maxWidth: 450 }}>
                            <View className="px-6 pt-4 pb-2 items-center">
                                <Text className="text-[28px] font-bold mb-2" style={[{ color: theme.text }]}>
                                    Login to your account
                                </Text>
                                <Text className="text-[14px] text-center leading-5" style={[{ color: theme.textSecondary }]}>
                                    Enter your email below{'\n'}to login to your account
                                </Text>
                            </View>

                            {/* Form */}
                            <View className="px-6 pt-8">
                                {/* Email */}
                                <Text className="text-[14px] font-medium mb-1.5" style={[{ color: theme.text }]}>Email</Text>
                                <TextInput
                                    placeholder="m@example.com"
                                    placeholderTextColor={theme.placeholder}
                                    keyboardType="email-address"
                                    textContentType="emailAddress"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                    editable={!isLoading}
                                    className="border rounded-lg px-3.5 py-3 text-[15px] mb-4"
                                    style={[{
                                        color: theme.text,
                                        borderColor: displayError ? '#ef4444' : theme.border,
                                        backgroundColor: theme.card,
                                    }]}
                                />

                                {/* Password label + Forgot link */}
                                <View className="flex-row items-center justify-between mb-1.5">
                                    <Text className="text-[14px] font-medium" style={[{ color: theme.text }]}>Password</Text>
                                    <Pressable
                                        onPress={() => { }}
                                        onPressIn={() => setIsHovering(true)}
                                        onPressOut={() => setIsHovering(false)}
                                    >
                                        <Text
                                            className="text-[12px]"
                                            style={[{
                                                color: isHovering ? theme.forgotHover : theme.textSecondary,
                                                textDecorationLine: isHovering ? "underline" : "none",
                                            }]}
                                        >
                                            Forgot your password?
                                        </Text>
                                    </Pressable>
                                </View>

                                {/* Password Input with toggle */}
                                <View className="relative">
                                    <TextInput
                                        secureTextEntry={!showPassword}
                                        placeholder=""
                                        placeholderTextColor={theme.placeholder}
                                        value={password}
                                        onChangeText={setPassword}
                                        editable={!isLoading}
                                        className="border rounded-lg px-3.5 py-3 text-[15px] mb-4"
                                        style={[{
                                            color: theme.text,
                                            borderColor: displayError ? '#ef4444' : theme.border,
                                            backgroundColor: theme.card,
                                        }]}
                                    />
                                    <Pressable
                                        onPress={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-0 bottom-4 justify-center"
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
                                    <Text className="text-[#ef4444] text-[13px] -mt-2 mb-2">{displayError}</Text>
                                )}
                            </View>

                            {/* Login Button */}
                            <View className="px-6 mt-2 pt-8">
                                <Pressable
                                    onPress={handleSubmit}
                                    disabled={isLoading}
                                    className="rounded-lg py-3.5 items-center justify-center"
                                    style={[{
                                        backgroundColor: theme.buttonBg,
                                        opacity: isLoading ? 0.6 : 1,
                                    }]}
                                >
                                    <Text className="font-semibold text-[16px]" style={[{ color: theme.buttonText }]}>
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


