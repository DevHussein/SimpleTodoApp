import { useColorScheme } from 'react-native';
import { useThemeStore } from '../store/themeStore';

const lightColors: Record<string, string> = {
  background: '#f5f5f5',
  foreground: '#18181b',
  surface: '#ffffff',
  surfaceSecondary: '#fafafa',

  border: '#e5e7eb',
  borderMedium: '#d1d5db',
  separator: '#f3f4f6',

  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  textSubtle: '#9ca3af',

  accent: '#9333ea',
  accentForeground: '#ffffff',
  accentLight: '#d8b4fe',
  accentSoftBg: '#f5f3ff',

  fieldBg: '#f9fafb',
  fieldBorder: '#e5e7eb',

  tabBarBg: '#ffffff',
  tabBarActive: '#9333ea',
  tabBarInactive: '#6b7280',

  switchTrackOff: '#d1d5db',
  switchThumbOff: '#f9fafb',

  modalBg: '#ffffff',
  modalBorder: '#d1d5db',
  modalShadowColor: '#111827',

  sortModalBg: '#ffffff',
  sortModalBorder: '#e5e7eb',
  sortGroupText: '#9ca3af',
  sortOptionBorder: '#f3f4f6',
  sortOptionActiveBg: '#f5f3ff',
  sortOptionText: '#374151',
  sortHeaderText: '#111827',

  progressBarBg: '#f5f3ff',

  filterChipBg: '#ffffff',
  filterChipBorder: '#e5e7eb',
  filterChipInactiveIcon: '#6b7280',
  filterChipInactiveText: '#374151',

  sortButtonBg: '#ffffff',
  sortButtonBorder: '#e5e7eb',

  cardBg: '#ffffff',
  cardBorder: '#e5e7eb',
  cardCompletedBg: '#fafafa',
  cardCompletedBorder: '#f3f4f6',
  cardShadow: '#111827',

  checkboxBorder: '#d1d5db',

  editBtnBg: '#eff6ff',
  editBtnIcon: '#3b82f6',
  deleteBtnBg: '#fef2f2',
  deleteBtnIcon: '#ef4444',

  completedBadgeBg: '#f0fdf4',
  completedBadgeText: '#16a34a',
  overdueBadgeBg: '#fef2f2',
  overdueBadgeText: '#dc2626',
  emptyIcon: '#d1d5db',

  dueDateOverdueBg: '#fef2f2',
  dueDateOverdueText: '#dc2626',
  dueDateOverdueBorder: '#fecaca',
  dueDateSoonBg: '#fffbeb',
  dueDateSoonText: '#d97706',
  dueDateSoonBorder: '#fde68a',
  dueDateNormalBg: '#f0fdf4',
  dueDateNormalText: '#16a34a',
  dueDateNormalBorder: '#bbf7d0',
  dueDateCompletedBg: '#f5f3ff',
  dueDateCompletedText: '#7c3aed',
  dueDateCompletedBorder: '#ddd6fe',

  errorBg: '#fef2f2',
  errorBorder: '#fecaca',
  errorIconCircleBg: '#fee2e2',
  errorIconColor: '#dc2626',
  errorText: '#991b1b',

  navHeaderBg: '#ffffff',
  navHeaderText: '#18181b',

  passwordToggleIcon: '#737373',
};

const darkColors: Record<string, string> = {
  background: '#09090b',
  foreground: '#fafafa',
  surface: '#18181b',
  surfaceSecondary: '#1c1c20',

  border: '#27272a',
  borderMedium: '#3f3f46',
  separator: '#27272a',

  textPrimary: '#f4f4f5',
  textSecondary: '#d4d4d8',
  textMuted: '#a1a1aa',
  textSubtle: '#71717a',

  accent: '#a855f7',
  accentForeground: '#18181b',
  accentLight: '#c084fc',
  accentSoftBg: '#2e1065',

  fieldBg: '#27272a',
  fieldBorder: '#3f3f46',

  tabBarBg: '#18181b',
  tabBarActive: '#a855f7',
  tabBarInactive: '#71717a',

  switchTrackOff: '#3f3f46',
  switchThumbOff: '#71717a',

  modalBg: '#18181b',
  modalBorder: '#27272a',
  modalShadowColor: '#000000',

  sortModalBg: '#18181b',
  sortModalBorder: '#27272a',
  sortGroupText: '#71717a',
  sortOptionBorder: '#27272a',
  sortOptionActiveBg: '#2e1065',
  sortOptionText: '#d4d4d8',
  sortHeaderText: '#f4f4f5',

  progressBarBg: '#2e1065',

  filterChipBg: '#27272a',
  filterChipBorder: '#3f3f46',
  filterChipInactiveIcon: '#a1a1aa',
  filterChipInactiveText: '#d4d4d8',

  sortButtonBg: '#27272a',
  sortButtonBorder: '#3f3f46',

  cardBg: '#18181b',
  cardBorder: '#27272a',
  cardCompletedBg: '#141416',
  cardCompletedBorder: '#1e1e22',
  cardShadow: '#000000',

  checkboxBorder: '#3f3f46',

  editBtnBg: '#172554',
  editBtnIcon: '#60a5fa',
  deleteBtnBg: '#450a0a',
  deleteBtnIcon: '#f87171',

  completedBadgeBg: '#052e16',
  completedBadgeText: '#4ade80',
  overdueBadgeBg: '#450a0a',
  overdueBadgeText: '#fca5a5',
  emptyIcon: '#3f3f46',

  dueDateOverdueBg: '#450a0a',
  dueDateOverdueText: '#fca5a5',
  dueDateOverdueBorder: '#7f1d1d',
  dueDateSoonBg: '#451a03',
  dueDateSoonText: '#fbbf24',
  dueDateSoonBorder: '#78350f',
  dueDateNormalBg: '#052e16',
  dueDateNormalText: '#4ade80',
  dueDateNormalBorder: '#166534',
  dueDateCompletedBg: '#2e1065',
  dueDateCompletedText: '#a78bfa',
  dueDateCompletedBorder: '#4c1d95',

  errorBg: '#450a0a',
  errorBorder: '#7f1d1d',
  errorIconCircleBg: '#7f1d1d',
  errorIconColor: '#f87171',
  errorText: '#fca5a5',

  navHeaderBg: '#18181b',
  navHeaderText: '#fafafa',

  passwordToggleIcon: '#a1a1aa',
};

export type ThemeColors = typeof lightColors;

type ThemeResult = {
  isDark: boolean;
  colors: ThemeColors;
};

export const useTheme = (): ThemeResult => {
  const systemColorScheme = useColorScheme();
  const preference = useThemeStore(state => state.preference);

  const isDark =
    preference === 'system'
      ? systemColorScheme === 'dark'
      : preference === 'dark';

  return {
    isDark,
    colors: isDark ? darkColors : lightColors,
  };
};
