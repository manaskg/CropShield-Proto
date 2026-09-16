import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Detect from './pages/Detect';
import SoilLab from './pages/SoilLab';
import SmartFarm from './pages/SmartFarm';
import ExpertConnect from './pages/ExpertConnect';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// Helper component to pass navigation compatibility
function PageWrapper({ Component }) {
  const navigate = useNavigate();
  
  const handleNavigate = (target) => {
    switch (target) {
      case 'home': return navigate('/');
      case 'detect': return navigate('/detect');
      case 'soil': return navigate('/soil');
      case 'smart-farm': return navigate('/smart-farm');
      case 'expert': return navigate('/expert');
      case 'login': return navigate('/login');
      case 'signup': return navigate('/signup');
      case 'profile': return navigate('/profile');
      default:
        if (target.startsWith('/')) return navigate(target);
        return navigate(`/${target}`);
    }
  };

  return <Component onNavigate={handleNavigate} />;
}

function AppContent() {
  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-emerald-500 selection:text-white">
      <NavBar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<PageWrapper Component={Home} />} />
          <Route path="/detect" element={<PageWrapper Component={Detect} />} />
          <Route path="/soil" element={<PageWrapper Component={SoilLab} />} />
          <Route path="/smart-farm" element={<PageWrapper Component={SmartFarm} />} />
          <Route path="/expert" element={<PageWrapper Component={ExpertConnect} />} />
          <Route path="/login" element={<PageWrapper Component={Login} />} />
          <Route path="/signup" element={<PageWrapper Component={SignUp} />} />
          <Route path="/profile" element={<PageWrapper Component={Profile} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
