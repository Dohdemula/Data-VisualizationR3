import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './Layout.css';

export default function Layout({ children, alertCount }) {
  return (
    <div className="layout">
      <Sidebar />
      <TopBar alertCount={alertCount} />
      <main className="layout-main">
        {children}
      </main>
    </div>
  );
}
