import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useOnline } from './hooks/useOnline';
import Layout from './components/layout/Layout';
import ScrollToTop from './components/layout/ScrollToTop';
import UpdateBanner from './components/layout/UpdateBanner';
import Verify from './pages/Verify';
import Login from './pages/Login';
import Inscription from './pages/Inscription';
import Onboarding from './pages/Onboarding';
import { isChunkLoadError, reloadOnceForChunkError } from './utils/pwa';

// Si le fichier d'une page n'existe plus (nouvelle version déployée), on réessaie
// une fois puis on recharge l'app pour récupérer la version à jour.
function lazyPage(importer) {
  return lazy(() =>
    importer().catch(async (err) => {
      if (!isChunkLoadError(err)) throw err;
      await new Promise(r => setTimeout(r, 800));
      try {
        return await importer();
      } catch (err2) {
        if (reloadOnceForChunkError()) return new Promise(() => {});
        throw err2;
      }
    })
  );
}

const Home = lazyPage(() => import('./pages/Home'));
const Annuaire = lazyPage(() => import('./pages/Annuaire'));
const MemberDetail = lazyPage(() => import('./pages/MemberDetail'));
const Agenda = lazyPage(() => import('./pages/Agenda'));
const EventDetail = lazyPage(() => import('./pages/EventDetail'));
const Admin = lazyPage(() => import('./pages/Admin'));
const Profile = lazyPage(() => import('./pages/Profile'));
const MemberDashboard = lazyPage(() => import('./pages/MemberDashboard'));
const NotFound = lazyPage(() => import('./pages/NotFound'));

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
      <ScrollToTop />
      <UpdateBanner />
      <Suspense fallback={
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full" />
        </div>
      }>
        <Routes>
          {/* Auth routes — outside Layout, loaded eagerly */}
          <Route path="/connexion" element={<Login />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/auth/verify" element={<Verify />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* App routes — inside Layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/annuaire" element={<Annuaire />} />
            <Route path="/annuaire/:id" element={<MemberDetail />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/agenda/:id" element={<EventDetail />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/:tab" element={<Admin />} />
            <Route path="/profil" element={<Profile />} />
            <Route path="/tableau-de-bord" element={<MemberDashboard />} />
          </Route>

          {/* Catch-all 404 — OUTSIDE Layout to avoid matching conflicts */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
