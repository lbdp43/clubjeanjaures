import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <Header />
        <main className="flex-1 p-4 pb-20 lg:pb-4 max-w-5xl mx-auto w-full">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
