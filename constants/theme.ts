import { Platform } from 'react-native';

const fontFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui' });

export const Fonts = {
  family: fontFamily,
  regular: { fontFamily, fontWeight: '400' as const },
  medium: { fontFamily, fontWeight: '500' as const },
  semibold: { fontFamily, fontWeight: '600' as const },
  bold: { fontFamily, fontWeight: '700' as const },
  title: { fontFamily, fontWeight: '700' as const, fontSize: 28, letterSpacing: -0.5 },
  heading: { fontFamily, fontWeight: '700' as const, fontSize: 20, letterSpacing: -0.2 },
  body: { fontFamily, fontWeight: '400' as const, fontSize: 16, lineHeight: 24 },
  caption: { fontFamily, fontWeight: '500' as const, fontSize: 13, lineHeight: 18 },
};

export const Colors = {
  light: {
    text: '#18211D', background: '#F5F7F5', surface: '#FFFFFF', surfaceSecondary: '#EDF2EE',
    tint: '#137A45', primary: '#137A45', primarySoft: '#DDF4E5', onPrimary: '#FFFFFF',
    icon: '#66736B', tabIconDefault: '#66736B', tabIconSelected: '#137A45',
    border: '#DCE5DE', muted: '#68756D', danger: '#B42318', warning: '#A85D00',
    header: '#113923', headerText: '#FFFFFF', overlay: 'rgba(16,35,24,0.45)',
  },
  dark: {
    text: '#E8F0EA', background: '#101713', surface: '#19221C', surfaceSecondary: '#222E26',
    tint: '#78D99A', primary: '#78D99A', primarySoft: '#203C2B', onPrimary: '#102117',
    icon: '#A7B5AA', tabIconDefault: '#A7B5AA', tabIconSelected: '#78D99A',
    border: '#2D3B31', muted: '#A7B5AA', danger: '#FF8A80', warning: '#F2B266',
    header: '#101713', headerText: '#E8F0EA', overlay: 'rgba(0,0,0,0.55)',
  },
};

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const Radius = { sm: 10, md: 16, lg: 24, pill: 999 };
