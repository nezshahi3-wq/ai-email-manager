import { createRoot } from 'react-dom/client';
import './index.css';
import ConfigError from './components/ConfigError';
import ErrorBoundary from './components/ErrorBoundary';

const env = import.meta.env;
const configured = Boolean(
  env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_AUTH_DOMAIN && env.VITE_FIREBASE_PROJECT_ID && env.VITE_FIREBASE_APP_ID,
);

const root = createRoot(document.getElementById('root')!);

if (!configured) {
  root.render(<ConfigError />);
} else {
  // تحميل App بشكل متأخر حتى لا تنهار الصفحة إن كانت إعدادات Firebase ناقصة
  import('./App').then(({ default: App }) =>
    root.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>,
    ),
  );
}
