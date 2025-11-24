'use client';

import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useFont, type FontFamily } from './FontProvider';

// Font family mappings
const fontFamilyMap: Record<string, string> = {
  'roboto': 'var(--font-roboto), sans-serif',
  'open-sans': 'var(--font-open-sans), sans-serif',
  'montserrat': 'var(--font-montserrat), sans-serif',
  'albert-sans': 'var(--font-albert-sans), sans-serif',
};

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use font from context, with fallback to 'albert-sans'
  let fontFamily: FontFamily = 'albert-sans';
  try {
    const fontContext = useFont();
    fontFamily = fontContext.fontFamily;
  } catch (error) {
    // FontProvider not available yet, use default
    console.warn('FontProvider not available, using default font');
  }
  
  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#4CAF50', // Material-UI green[500]
        dark: '#388E3C', // Material-UI green[700]
        light: '#81C784', // Material-UI green[300]
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#66BB6A', // Material-UI green[400]
        dark: '#43A047', // Material-UI green[600]
        light: '#A5D6A7', // Material-UI green[200]
        contrastText: '#ffffff',
      },
      background: {
        default: '#f5f5f5',
        paper: '#ffffff',
      },
    },
    typography: {
      fontFamily: fontFamilyMap[fontFamily] || fontFamilyMap['albert-sans'],
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontFamily: fontFamilyMap[fontFamily] || fontFamilyMap['albert-sans'],
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            fontFamily: fontFamilyMap[fontFamily] || fontFamilyMap['albert-sans'],
          },
        },
      },
      MuiListItemText: {
        styleOverrides: {
          primary: {
            fontFamily: fontFamilyMap[fontFamily] || fontFamilyMap['albert-sans'],
          },
          secondary: {
            fontFamily: fontFamilyMap[fontFamily] || fontFamilyMap['albert-sans'],
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            fontFamily: fontFamilyMap[fontFamily] || fontFamilyMap['albert-sans'],
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          label: {
            fontFamily: fontFamilyMap[fontFamily] || fontFamilyMap['albert-sans'],
          },
        },
      },
      MuiCardHeader: {
        styleOverrides: {
          title: {
            fontFamily: fontFamilyMap[fontFamily] || fontFamilyMap['albert-sans'],
          },
          subheader: {
            fontFamily: fontFamilyMap[fontFamily] || fontFamilyMap['albert-sans'],
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontFamily: fontFamilyMap[fontFamily] || fontFamilyMap['albert-sans'],
          },
        },
      },
      MuiFormLabel: {
        styleOverrides: {
          root: {
            fontFamily: fontFamilyMap[fontFamily] || fontFamilyMap['albert-sans'],
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontFamily: fontFamilyMap[fontFamily] || fontFamilyMap['albert-sans'],
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontFamily: fontFamilyMap[fontFamily] || fontFamilyMap['albert-sans'],
          },
        },
      },
    },
  });

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

