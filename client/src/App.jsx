import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useOnline } from './hooks/useOnline';
import Layout from './components/layout/Layout';

const Home = lazy(() => import('./pages/Home'));
const Annuaire = lazy(() => import('./pages/Annuaire'));
const MemberDetail = lazy(() => import('./pages/MemberDetail'));
const Agenda = lazy(() => import('./pages/Agenda'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const Feed = lazy(() => import('./pages/Feed'));
const Admin = lazy(() => import('./pages/Admin'));
const Profile = lazy(() => import('./pages/Profile'));
const MemberDashboard = lazy(() => import('./pages/MemberDashboard'));
const Login = lazy(() => import('./pages/Login'));
const Verify = lazy(() => import('./pages/Verify'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Inscription = lazy(() => import('./pages/Inscription'));
const NotFound = lazy(() => import('./pages/NotFound'));

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
      <Suspense fallback={
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full" />
        </div>
      }>
        <Routes>
          <Route path="/connexion" element={<Login />} />
          <Route path="/auth/verify" element={<Verify />} />
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
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
