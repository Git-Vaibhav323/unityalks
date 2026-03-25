// Centralized Spotify theme
export const theme = {
  colors: {
    spotifyGreen: '#1DB954',
    spotifyGreenDark: '#19a64c',
    spotifyGreenDarker: '#12833a',
    black: '#000000',
    appBg: '#000000', // Pure black background
    surface: '#121212', // Dark surface
    surfaceAlt: '#181818', // Slightly lighter dark surface
    textPrimary: '#FFFFFF',
    textSecondary: '#B3B3B3',
    border: 'rgba(255,255,255,0.08)'
  },
};

export function alpha(hex, a) {
  // Accept #RRGGBB or #RGB
  let r, g, b;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  } else {
    return hex;
  }
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
