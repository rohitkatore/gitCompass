import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ user, onLogout }) => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0f172a'
    }}>
      {/* Fixed navbar */}
      <Navbar user={user} onLogout={onLogout} />

      {/* Main content with explicit top padding to clear fixed navbar */}
      <main style={{
        flex: 1,
        paddingTop: '64px',
        width: '100%',
        minHeight: '100vh'
      }}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default Layout;
