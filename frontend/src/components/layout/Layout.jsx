import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ user, onLogout }) => {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <Navbar user={user} onLogout={onLogout} />
      <main className="flex-1 pt-16 w-full">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default Layout;
