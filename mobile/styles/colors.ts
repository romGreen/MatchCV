export const colors = {
  // Primary colors
  primary: '#6200ea',
  primaryLight: '#9c4dcc',
  primaryDark: '#3700b3',
  
  // Secondary colors
  secondary: '#03dac6',
  secondaryLight: '#66fff9',
  secondaryDark: '#00a896',
  
  // Neutral colors
  white: '#ffffff',
  black: '#000000',
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Status colors
  success: '#4caf50',
  successLight: '#e8f5e8',
  warning: '#ff9800',
  warningLight: '#fff3e0',
  error: '#f44336',
  errorLight: '#ffebee',
  info: '#2196f3',
  infoLight: '#e3f2fd',
  
  // Background colors
  background: '#f5f5f5',
  surface: '#ffffff',
  surfaceVariant: '#f8f9fa',
  
  // Text colors
  text: {
    primary: '#212121',
    secondary: '#757575',
    disabled: '#bdbdbd',
    onPrimary: '#ffffff',
    onSecondary: '#000000',
  },
  
  // Border colors
  border: '#e0e0e0',
  borderLight: '#f0f0f0',
  borderDark: '#bdbdbd',
  
  // Shadow colors
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.25)',
} as const;

export type ColorKey = keyof typeof colors;
export type GrayColorKey = keyof typeof colors.gray;
export type TextColorKey = keyof typeof colors.text;
