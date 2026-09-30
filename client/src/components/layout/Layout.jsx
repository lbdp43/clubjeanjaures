import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import PullToRefresh from './PullToRefresh';

export default function Layout() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64 overflow-x-hidden">
        <Header />
        <PullToRefresh>
          <main className="flex-1 px-4 pt-4 pb-24 lg:pb-8 max-w-5xl mx-auto w-full">
            <Outlet />
          </main>
        </PullToRefresh>
        <BottomNav />
      </div>
    </div>
  );
}
