import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { router } from './router/index.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { store } from './store/store.ts';
import GlobalToast from './components/Toast/GlobalToast.tsx';
import './index.css';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <RouterProvider router={router} />
        <GlobalToast />
      </ThemeProvider>
    </Provider>
  </StrictMode>,
)
