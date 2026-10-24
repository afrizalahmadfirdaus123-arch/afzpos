// Type declarations for VS Code editing and React Native Expo environments
/// <reference types="react" />

declare module 'react-native' {
  export const SafeAreaView: React.ComponentType<any>;
  export const StatusBar: React.ComponentType<any>;
  export const StyleSheet: {
    create: <T extends Record<string, any>>(styles: T) => T;
  };
  export const View: React.ComponentType<any>;
  export const Text: React.ComponentType<any>;
  export const TouchableOpacity: React.ComponentType<any>;
  export const TextInput: React.ComponentType<any>;
  export const ScrollView: React.ComponentType<any>;
  export const FlatList: React.ComponentType<any>;
  export const Modal: React.ComponentType<any>;
  export const Alert: {
    alert: (title: string, message?: string, buttons?: Array<{ text: string; style?: string; onPress?: () => void }>) => void;
  };
  export const Linking: {
    canOpenURL: (url: string) => Promise<boolean>;
    openURL: (url: string) => Promise<any>;
  };
  export const Image: React.ComponentType<any>;
  export const Dimensions: {
    get: (dim: 'window' | 'screen') => { width: number; height: number };
  };
}

declare module '@expo/vector-icons' {
  export const Ionicons: React.ComponentType<any>;
  export const MaterialCommunityIcons: React.ComponentType<any>;
  export const Feather: React.ComponentType<any>;
  export const FontAwesome: React.ComponentType<any>;
  export const MaterialIcons: React.ComponentType<any>;
}
