import React, { useState, useEffect } from 'react';
import { storage } from './services/storage';
import Dashboard from './components/Dashboard';
import AssetList from './components/AssetList';
import IssueList from './components/IssueList';
import TechnicianPortal from './components/TechnicianPortal';
import PublicAssetPage from './components/PublicAssetPage';
import Settings from './components/Settings';
import Auth from './components/Auth';
import { 
  LayoutDashboard, 
  Wrench, 
  FileText, 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  QrCode, 
  Sparkles,
  LogOut
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => storage.getCurrentUser());
  const [currentRole, setCurrentRole] = useState(() => {
    if (window.location.hash.startsWith('#/public/')) return 'public';
    const user = storage.getCurrentUser();
    return user ? user.role : 'admin';
  });
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, assets, issues, technician, settings
  const [isDark, setIsDark] = useState(true);
  
  // Routing code state
  const [urlAssetCode, setUrlAssetCode] = useState('');
  const [selectedAssetCode, setSelectedAssetCode] = useState('');

  useEffect(() => {
    // 1. Initial Database Seed Check
    const assets = localStorage.getItem('maintainiq_assets');
    if (!assets) {
      storage.resetDatabase();
    }


    // 2. Hash Routing Listener for QR Codes
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/public/')) {
        const code = hash.replace('#/public/', '').trim();
        setUrlAssetCode(code);
        setCurrentRole('public');
      } else {
        setUrlAssetCode('');
        if (currentRole === 'public') {
          // If we exit public hash and were public, restore logged in user role or default to admin
          const user = storage.getCurrentUser();
          if (user) {
            setCurrentUser(user);
            setCurrentRole(user.role);
            if (user.role === 'technician') {
              setActiveTab('technician');
            } else {
              setActiveTab('dashboard');
            }
          } else {
            setCurrentRole('admin');
            setActiveTab('dashboard');
          }
        }
      }
    };

    // Run once on load
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Theme Sync
  useEffect(() => {
    const body = document.body;
    if (isDark) {
      body.classList.remove('light-mode');
    } else {
      body.classList.add('light-mode');
    }
  }, [isDark]);

  // Handle Switch Role manually via floats
  const handleRoleChange = (role) => {
    if (role === 'public') {
      setCurrentRole('public');
      if (urlAssetCode) {
        window.location.hash = `#/public/${urlAssetCode}`;
      } else {
        window.location.hash = ''; // Scanner Simulation Home
      }
    } else {
      // Clear hash if moving away from public page to admin dashboard
      window.history.pushState("", document.title, window.location.pathname + window.location.search);
      setUrlAssetCode('');
      
      // Auto-login corresponding seeded user on role change to maintain switcher behavior
      let defaultEmail = '';
      let defaultPass = '';
      if (role === 'admin') {
        defaultEmail = 'admin@maintainiq.com';
        defaultPass = 'admin123';
      } else if (role === 'technician') {
        defaultEmail = 'alice@maintainiq.com';
        defaultPass = 'tech123';
      } else if (role === 'supervisor') {
        defaultEmail = 'supervisor@maintainiq.com';
        defaultPass = 'super123';
      }

      try {
        const loggedUser = storage.loginUser(defaultEmail, defaultPass);
        setCurrentUser(loggedUser);
        setCurrentRole(role);
        
        // Auto-focus tabs based on roles for better UX
        if (role === 'technician') {
          setActiveTab('technician');
        } else {
          setActiveTab('dashboard');
        }
      } catch (err) {
        console.error("Auto login failed in role switcher: ", err);
      }
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    if (user.role === 'technician') {
      setActiveTab('technician');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    storage.logoutUser();
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // Check if we are currently rendering the clean full-screen public mobile view
  const isPublicLayout = currentRole === 'public';

  const renderActiveComponent = () => {
    if (isPublicLayout) {
      return <PublicAssetPage urlAssetCode={urlAssetCode} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} setSelectedAssetCode={setSelectedAssetCode} />;
      case 'assets':
        return <AssetList selectedCode={selectedAssetCode} setSelectedCode={setSelectedAssetCode} />;
      case 'issues':
        return <IssueList currentRole={currentRole} activeTab={activeTab} setActiveTab={setActiveTab} setSelectedAssetCode={setSelectedAssetCode} />;
      case 'technician':
        return <TechnicianPortal />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard setActiveTab={setActiveTab} setSelectedAssetCode={setSelectedAssetCode} />;
    }
  };

  if (!currentUser && !isPublicLayout) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <header className="role-simulation-bar print-hide">
        <div className="sim-brand">
          <Wrench size={20} />
          <span>MaintainIQ</span>
          <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: '10px', color: 'var(--accent)', fontWeight: 600 }}>
            Prototype
          </span>
        </div>

        <div className="sim-controls">
          {/* Active Sim Badge Indicator */}
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Active View:
          </span>

          <div className="role-badge-selector">
            <button 
              className={`role-btn ${currentRole === 'public' ? 'active public' : ''}`}
              onClick={() => handleRoleChange('public')}
            >
              Public Reporter
            </button>
            <button 
              className={`role-btn ${currentRole === 'admin' ? 'active admin' : ''}`}
              onClick={() => handleRoleChange('admin')}
            >
              Administrator
            </button>
            <button 
              className={`role-btn ${currentRole === 'technician' ? 'active technician' : ''}`}
              onClick={() => handleRoleChange('technician')}
            >
              Technician
            </button>
            <button 
              className={`role-btn ${currentRole === 'supervisor' ? 'active supervisor' : ''}`}
              onClick={() => handleRoleChange('supervisor')}
            >
              Supervisor
            </button>
          </div>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }}></div>

          {/* Theme Switch */}
          <button className="theme-toggle-btn" onClick={() => setIsDark(!isDark)} title="Toggle theme">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <div className="main-wrapper">
        
        {/* Left Sidebar Menu (Hidden in public mode or when printing labels) */}
        {!isPublicLayout && (
          <aside className="sidebar print-hide">
            {/* User Profile Widget */}
            {currentUser && (
              <div className="sidebar-user-profile">
                <div className="user-avatar-circle">
                  {currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div className="user-info-text">
                  <div className="user-info-name">{currentUser.name}</div>
                  <div className="user-info-email">{currentUser.email}</div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                    <span className={`badge badge-${currentRole}`} style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                      {currentRole === 'admin' ? 'Admin' : currentRole === 'technician' ? 'Technician' : 'Supervisor'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="sidebar-nav">
              <div className="sidebar-section-title" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', paddingLeft: '16px', marginBottom: '8px', fontWeight: 700 }}>
                Operations
              </div>
              
              {/* Dashboard */}
              <div 
                className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </div>

              {/* Assets Directory */}
              <div 
                className={`nav-item ${activeTab === 'assets' ? 'active' : ''}`}
                onClick={() => setActiveTab('assets')}
              >
                <QrCode size={18} />
                <span>Assets Directory</span>
              </div>

              {/* Issues Ticket Log */}
              <div 
                className={`nav-item ${activeTab === 'issues' ? 'active' : ''}`}
                onClick={() => setActiveTab('issues')}
              >
                <FileText size={18} />
                <span>Issues Board</span>
              </div>

              {/* Technician assigned logs - Admin/Supervisor can peek, Tech forced focus */}
              <div 
                className={`nav-item ${activeTab === 'technician' ? 'active' : ''}`}
                onClick={() => setActiveTab('technician')}
              >
                <Wrench size={18} />
                <span>Technician Portal</span>
              </div>
            </div>

            <div className="sidebar-footer">
              <div 
                className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
                style={{ borderLeft: 'none' }}
              >
                <SettingsIcon size={18} />
                <span>Settings</span>
              </div>

              {/* Log Out Button */}
              {currentUser && (
                <div 
                  className="nav-item text-danger"
                  onClick={handleLogout}
                  style={{ borderLeft: 'none', color: 'var(--danger)' }}
                >
                  <LogOut size={18} />
                  <span>Log Out</span>
                </div>
              )}
              
              <div style={{ padding: '16px', fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={10} className="text-accent" />
                <span>MaintainIQ Prototype v1.0</span>
              </div>
            </div>
          </aside>
        )}

        {/* Content Container (Full Width for public mobile layout) */}
        <main 
          className="content-area" 
          style={{ 
            marginLeft: isPublicLayout ? '0' : '',
            width: isPublicLayout ? '100%' : '',
            padding: isPublicLayout ? '0' : ''
          }}
        >
          {renderActiveComponent()}
        </main>
      </div>

    </div>
  );
}
