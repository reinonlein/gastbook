import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
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
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

