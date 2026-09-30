import { useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import PullToRefresh from './PullToRefresh';
import PageTransition from './PageTransition';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';

export default function Layout() {
  const mainRef = useRef(null);
  useSwipeNavigation(mainRef);

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64 overflow-x-clip min-w-0">
        <Header />
        <PullToRefresh>
          <main ref={mainRef} className="flex-1 px-4 pt-4 pb-28 lg:pb-8 max-w-5xl mx-auto w-full will-change-transform">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </main>
        </PullToRefresh>
        <BottomNav />
      </div>
    </div>
  );
}
