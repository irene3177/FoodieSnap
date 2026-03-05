import { useLocation, Outlet } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import AnimatedPage from './components/AnimatedPage/AnimatedPage';
import './App.css'

function App() {
  const location = useLocation();
  return (
    <div className="App">
      <Header />
      <main className="main-content">
        <AnimatedPage key={location.pathname}>
          <Outlet />
        </AnimatedPage>
      </main>
      <Footer />
    </div>
  );
}

export default App
