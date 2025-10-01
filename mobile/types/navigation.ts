import { NavigatorScreenParams } from '@react-navigation/native';

// Root Stack Navigator
export type RootStackParamList = {
  Welcome: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<TabParamList>;
  Chat: { chatId: string };
  ProfileView: { userId: string };
  ProfileEdit: undefined;
};

// Auth Stack Navigator
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Tab Navigator
export type TabParamList = {
  Discover: undefined;
  Messages: undefined;
  Profile: undefined;
  Settings: undefined;
};

// Navigation prop types
export type RootStackScreenProps<T extends keyof RootStackParamList> = {
  navigation: any;
  route: { params: RootStackParamList[T] };
};

export type TabScreenProps<T extends keyof TabParamList> = {
  navigation: any;
  route: { params: TabParamList[T] };
};

export type AuthScreenProps<T extends keyof AuthStackParamList> = {
  navigation: any;
  route: { params: AuthStackParamList[T] };
};
