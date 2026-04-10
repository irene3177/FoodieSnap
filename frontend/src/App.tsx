import { useEffect, useRef } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAppDispatch } from './store/store';
import {
  selectUser,
  selectIsAuthenticated,
  checkSession,
  selectHasCheckedSession,
  selectAuthLoading
} from './store/authSlice';
import { loadUnreadCounts } from './store/unreadSlice';
import { selectIsLoggingOut } from './store/authSlice';
import { useUnreadListener } from './hooks/chat/useUnreadListener';
import * as socket from './services/socket';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import AnimatedPage from './components/AnimatedPage/AnimatedPage';
import './App.css'

function App() {
  const dispatch = useAppDispatch();
  const user = useSelector(selectUser);
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const hasCheckedSession = useSelector(selectHasCheckedSession);
  const checkSessionCalled = useRef(false);
  const socketConnected = useRef(false);
  const unreadLoaded = useRef(false);
  const isLoggingOut = useSelector(selectIsLoggingOut);
  

  useEffect(() => {
    if (!isAuthenticated) {
      checkSessionCalled.current = false;
      unreadLoaded.current = false;
      socketConnected.current = false;
    }
  }, [isAuthenticated]);

  // Connect socket globally when user is authenticated
  useEffect(() => {
    if (user?._id && isAuthenticated && !socketConnected.current) {
      socket.connectSocket(user._id);
      socketConnected.current = true;
    }
  }, [user?._id, isAuthenticated]);

  useEffect(() => {
    if (user?._id && isAuthenticated && socketConnected.current && !unreadLoaded.current) {
      dispatch(loadUnreadCounts(user._id));
      unreadLoaded.current = true;
    }
  }, [user?._id, isAuthenticated, dispatch]);

  useUnreadListener(user?._id);
  
  useEffect(() => {
    if (isLoggingOut) return;

    if (!isAuthenticated && hasCheckedSession) {
      return;
    }
    if (isLoading) return;
    if (checkSessionCalled.current) return;

    if (!hasCheckedSession && !isLoading) {
      checkSessionCalled.current = true;
      dispatch(checkSession());
    }
  }, [dispatch, hasCheckedSession, isLoading, isLoggingOut, isAuthenticated]);

  
  const isChatPage = location.pathname.startsWith('/chat/');
  return (
    <div className="App">
      {!isChatPage && <Header />}
      <main className={`main-content ${isChatPage ? 'main-content--full' : ''}`}>
        <AnimatedPage key={location.pathname}>
          <Outlet />
        </AnimatedPage>
      </main>
      {!isChatPage && <Footer />}
    </div>
  );
}

export default App;