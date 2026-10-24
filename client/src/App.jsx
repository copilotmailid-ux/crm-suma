import { BrowserRouter } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import './styles/index.css';
import './styles/layout.css';
import './styles/dashboard.css';
import './styles/forms.css';
import './styles/tables.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        {typeof document !== 'undefined'
          ? createPortal(
              <Toaster
                position="top-right"
                containerStyle={{
                  position: 'fixed',
                  zIndex: 2147483647,
                  top: 20,
                  right: 20,
                  pointerEvents: 'none',
                }}
                toastOptions={{
                  className: 'ksr-toast',
                  duration: 3800,
                  style: {
                    background: '#ffffff',
                    color: '#0f172a',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    fontSize: '0.885rem',
                    fontWeight: 600,
                    borderRadius: '14px',
                    padding: '12px 18px',
                    border: '1px solid rgba(11, 29, 55, 0.1)',
                    boxShadow: '0 20px 35px -6px rgba(11, 29, 55, 0.16), 0 8px 16px -4px rgba(11, 29, 55, 0.08)',
                    zIndex: 2147483647,
                    pointerEvents: 'auto',
                    maxWidth: '460px',
                    lineHeight: '1.45',
                  },
                  success: {
                    iconTheme: { primary: '#059669', secondary: '#ecfdf5' },
                    style: {
                      borderLeft: '4.5px solid #059669',
                    },
                  },
                  error: {
                    iconTheme: { primary: '#dc2626', secondary: '#fef2f2' },
                    style: {
                      borderLeft: '4.5px solid #dc2626',
                    },
                  },
                  loading: {
                    iconTheme: { primary: '#c59e51', secondary: '#fefce8' },
                    style: {
                      borderLeft: '4.5px solid #c59e51',
                    },
                  },
                }}
              />,
              document.body
            )
          : null}
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
