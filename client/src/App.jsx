import { BrowserRouter } from 'react-router-dom';
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
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1a1a2e',
              color: '#f1f5f9',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              borderRadius: '10px',
              fontSize: '0.875rem',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#f1f5f9' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
