// Re-export all types
export * from './api';
export * from './navigation';

// Common utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Form types
export interface FormField<T = any> {
  value: T;
  error?: string;
  touched: boolean;
  required?: boolean;
}

export interface FormState<T = Record<string, any>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
}

// Component prop types
export interface BaseComponentProps {
  style?: any;
  testID?: string;
}

export interface LoadingProps extends BaseComponentProps {
  loading?: boolean;
  text?: string;
}

export interface ErrorProps extends BaseComponentProps {
  error?: string;
  onRetry?: () => void;
}

// State management types
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface PaginatedState<T> extends AsyncState<T[]> {
  hasMore: boolean;
  page: number;
  total: number;
}