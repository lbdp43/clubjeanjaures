import { Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useOnline } from './hooks/useOnline';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Annuaire from './pages/Annuaire';
import MemberDetail from './pages/MemberDetail';
import Agenda from './pages/Agenda';
import EventDetail from './pages/EventDetail';
import Feed from './pages/Feed';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import MemberDashboard from './pages/MemberDashboard';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Inscription from './pages/Inscription';

export default function App() {
  const { loading } = useAuth();
  const online = useOnline();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      {!online && <div className="offline-banner">Mode hors-ligne</div>}
      <Routes>
        <Route path="/connexion" element={<Login />} />
        <Route path="/inscription" element={<Inscription />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/annuaire" element={<Annuaire />} />
          <Route path="/annuaire/:id" element={<MemberDetail />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/agenda/:id" element={<EventDetail />} />
          <Route path="/fil" element={<Feed />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/profil" element={<Profile />} />
          <Route path="/tableau-de-bord" element={<MemberDashboard />} />
        </Route>
      </Routes>
    </>
  );
}
