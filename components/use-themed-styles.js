import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fonts } from '../constants/theme';
import { useAppTheme } from '../contexts/ThemeContext';

const SURFACE_COLORS = new Set(['white', '#fff', '#ffffff', '#fefefe']);
const BACKGROUND_COLORS = new Set(['#f8fafc', '#f4f7f8', '#f5f7f5', '#fafafa']);
const SOFT_COLORS = new Set(['#f1f5f9', '#f0f3f4', '#e2e8f0', '#d9d9d9', '#edf2f7']);
const DARK_TEXT_COLORS = new Set(['#000', '#000000', '#0f172a', '#111827', '#18211d', '#1e293b', '#243344', '#334155']);
const MUTED_COLORS = new Set(['#64748b', '#667085', '#687076', '#7b8491', '#8792a3', '#94a3b8', '#9ba1a6']);
const BRAND_COLORS = new Set(['#6ee794', '#10b981', '#137a45']);
const HEADER_COLORS = new Set(['#101422', '#113923']);

function normalizeColor(value) {
  return typeof value === 'string' ? value.toLowerCase() : value;
}

function themedStyle(name, source, colors, topInset) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return source;

  const style = { ...source };
  const key = name.toLowerCase();
  const isPage = ['container', 'screen', 'page', 'contentcontainer'].includes(key);
  const isHeader = key.includes('header');
  const isControl = /input|search|selector|chip|tabcontainer|iconcontainer|avatarcontainer/.test(key);
  const isBrandCard = /winner|hero|featured|banner|highlight/.test(key);
  const isCard = /card|panel|form|menucontainer|task|result|setting|faq/.test(key);
  const hasCardSurface = isCard && source.backgroundColor !== undefined;

  if (isPage) style.backgroundColor = colors.background;
  else if (isHeader) style.backgroundColor = colors.header;
  else if (isControl && style.backgroundColor) style.backgroundColor = colors.surfaceSecondary;
  else if (isCard && style.backgroundColor) style.backgroundColor = isBrandCard ? colors.header : colors.surface;

  for (const property of ['backgroundColor', 'borderColor', 'color', 'shadowColor']) {
    const original = normalizeColor(source[property]);
    if (property === 'backgroundColor' && typeof original === 'string' && /^rgba\(\s*255\s*,\s*255\s*,\s*255/.test(original)) {
      style[property] = colors.background === '#101713' ? 'rgba(16,23,19,0.82)' : 'rgba(255,255,255,0.82)';
    }
    if (property === 'backgroundColor' && !isPage && !isHeader && !isControl && !isCard) {
      if (SURFACE_COLORS.has(original)) style[property] = isBrandCard ? colors.header : colors.surface;
      else if (BACKGROUND_COLORS.has(original)) style[property] = colors.background;
      else if (SOFT_COLORS.has(original)) style[property] = colors.surfaceSecondary;
      else if (BRAND_COLORS.has(original)) style[property] = colors.primary;
      else if (HEADER_COLORS.has(original)) style[property] = colors.header;
    }
    if (property === 'borderColor' && (SURFACE_COLORS.has(original) || SOFT_COLORS.has(original))) style[property] = colors.border;
    if (property === 'color') {
      if (DARK_TEXT_COLORS.has(original)) style[property] = colors.text;
      else if (MUTED_COLORS.has(original)) style[property] = colors.muted;
      else if (BRAND_COLORS.has(original)) style[property] = colors.primary;
      else if (original === '#ffffff' || original === '#fff' || original === 'white') {
        if (/addbutton|headerbutton/.test(key)) style[property] = colors.headerText;
        else if (/buttontext|buttonlabel/.test(key)) style[property] = colors.onPrimary;
        else if (/header|logo|inverted|textwhite|winner|brand/.test(key)) style[property] = colors.headerText;
        else style[property] = colors.text;
      }
    }
  }

  if (style.fontSize !== undefined) {
    style.fontFamily = Fonts.family;
    if (style.fontWeight === '800' || style.fontWeight === '900' || style.fontWeight === 'bold') style.fontWeight = '700';
    if (style.fontSize <= 10) style.fontSize = 11;
  }

  if (isHeader && style.paddingTop >= 40) style.paddingTop = Math.max(topInset, 12) + 12;
  if (key === 'content') {
    if (style.marginTop < 0) style.marginTop = 0;
    if (style.paddingTop === undefined) style.paddingTop = 16;
  }
  if (hasCardSurface && style.marginTop >= 30) style.marginTop = 20;

  if (style.borderRadius !== undefined && style.borderRadius >= 12 && style.borderRadius < 40 && /card|panel|form|box|button|input|menu/.test(key)) {
    style.borderRadius = Math.max(16, Math.min(style.borderRadius, 24));
  }

  if (hasCardSurface) {
    if (style.elevation !== undefined) style.elevation = Math.min(style.elevation, 2);
    if (style.shadowOpacity !== undefined) style.shadowOpacity = Math.min(style.shadowOpacity, 0.08);
    if (!style.borderWidth) style.borderWidth = StyleSheet.hairlineWidth;
    if (!style.borderColor) style.borderColor = colors.border;
  }

  return style;
}

export function useThemedStyles(baseStyles) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  return useMemo(() => {
    const output = {};
    for (const [name, value] of Object.entries(baseStyles)) {
      output[name] = themedStyle(name, StyleSheet.flatten(value), colors, insets.top || 0);
    }
    return StyleSheet.create(output);
  }, [baseStyles, colors, insets.top]);
}
