import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from './index';

export const commonStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  
  // Card styles
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...spacing.shadow.sm,
  },
  
  cardHeader: {
    marginBottom: spacing.sm,
  },
  
  cardContent: {
    paddingVertical: spacing.sm,
  },
  
  // Button styles
  button: {
    borderRadius: spacing.radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  
  buttonSecondary: {
    backgroundColor: colors.secondary,
  },
  
  buttonOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  
  buttonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.onPrimary,
  },
  
  buttonTextOutlined: {
    color: colors.primary,
  },
  
  // Input styles
  input: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  
  inputFocused: {
    borderColor: colors.primary,
  },
  
  inputError: {
    borderColor: colors.error,
  },
  
  // Text styles
  text: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.regular,
  },
  
  textSmall: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  
  textLarge: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
  },
  
  textTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  
  textSubtitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  
  textError: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
  },
  
  textSuccess: {
    color: colors.success,
    fontSize: typography.fontSize.sm,
  },
  
  // Layout styles
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  column: {
    flexDirection: 'column',
  },
  
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  spaceBetween: {
    justifyContent: 'space-between',
  },
  
  spaceAround: {
    justifyContent: 'space-around',
  },
  
  // Spacing utilities
  marginTop: {
    marginTop: spacing.md,
  },
  
  marginBottom: {
    marginBottom: spacing.md,
  },
  
  marginHorizontal: {
    marginHorizontal: spacing.md,
  },
  
  marginVertical: {
    marginVertical: spacing.md,
  },
  
  paddingHorizontal: {
    paddingHorizontal: spacing.md,
  },
  
  paddingVertical: {
    paddingVertical: spacing.md,
  },
  
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
  },
  
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  
  emptyText: {
    textAlign: 'center',
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  
  // Avatar styles
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  
  // Chip styles
  chip: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: spacing.radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  
  chipSelected: {
    backgroundColor: colors.primary,
  },
  
  chipText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  
  chipTextSelected: {
    color: colors.text.onPrimary,
  },
  
  // Divider styles
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  
  // Badge styles
  badge: {
    backgroundColor: colors.error,
    borderRadius: spacing.radius.full,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  badgeText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
});
