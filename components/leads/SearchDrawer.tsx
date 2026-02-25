import CustomBottomSheet from '@/components/ui/CustomBottomSheet';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Search } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSearch: (params: { name: string }) => void;
    initialValues?: { name?: string };
};

export default function SearchDrawer({
    isOpen,
    onClose,
    onSearch,
    initialValues,
}: Props) {
    const [name, setName] = useState('');
    const isDark = useColorScheme() === 'dark';

    useEffect(() => {
        setName(initialValues?.name || '');
    }, [initialValues]);

    const handleSearch = () => {
        onSearch({ name: name.trim() });
        onClose();
    };

    const theme = {
        inputBg: isDark ? '#222' : '#f4f4f5',
        inputText: isDark ? '#fff' : '#000',
        placeholder: isDark ? '#666' : '#999',
        btnBg: isDark ? '#E5E5E5' : '#000000ff', // Search Button  Background
        btnText: isDark ? '#000000ff' : '#ffffffff', // Search Button Text
    };

    return (
        <CustomBottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title="Search Leads"
            height={300}
        >
            <View className="gap-5">
                <View
                    className="flex-row items-center px-3 h-[50px] rounded-xl gap-[10px]"
                    style={{ backgroundColor: theme.inputBg }}
                >
                    <Search size={20} color={theme.placeholder} />
                    <TextInput
                        className="flex-1 text-base h-full"
                        style={{ color: theme.inputText }}
                        placeholder="Search by name..."
                        placeholderTextColor={theme.placeholder}
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="none"
                    />
                </View>

                <Pressable
                    className="h-[50px] rounded-xl justify-center items-center mt-[10px]"
                    style={{ backgroundColor: theme.btnBg }}
                    onPress={handleSearch}
                >
                    <Text className="text-base font-semibold" style={{ color: theme.btnText }}>Search</Text>
                </Pressable>
            </View>
        </CustomBottomSheet>
    );
}
