import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { 
  Wrench, 
  ShieldAlert, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  DollarSign,
  TrendingUp,
  AlertOctagon,
  ArrowRight
} from 'lucide-react';

export default function Dashboard({ setActiveTab, setSelectedAssetCode }) {
  const [stats, setStats] = useState({
    totalAssets: 0,
    openIssues: 0,
    activeCost: 0,
    avgResolutionTime: '0 days',
    unsafeCount: 0
  });

  const [unsafeAssets, setUnsafeAssets] = useState([]);
  const [upcomingServices, setUpcomingServices] = useState([]);
  const [issuesStatusCounts, setIssuesStatusCounts] = useState({});
  const [assetsStatusCounts, setAssetsStatusCounts] = useState({});

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    const assets = storage.getAssets();
    const issues = storage.getIssues();

    // 1. Core Analytics
    const totalAssets = assets.length;
    const activeIssues = issues.filter(i => !['Resolved', 'Closed'].includes(i.status)).length;
    
    const activeCost = issues
      .filter(i => ['Resolved', 'Closed'].includes(i.status))
      .reduce((sum, i) => sum + (Number(i.maintenanceCost) || 0), 0);

    const unsafeCount = assets.filter(a => a.status === 'Out of Service' || a.condition === 'Unsafe').length;
    const unsafeList = assets.filter(a => a.status === 'Out of Service' || a.condition === 'Unsafe');

    // Average resolution time calculation
    const resolvedIssues = issues.filter(i => ['Resolved', 'Closed'].includes(i.status) && i.completionDate && i.createdAt);
    let avgText = 'N/A';
    if (resolvedIssues.length > 0) {
      const totalDiffMs = resolvedIssues.reduce((sum, i) => {
        const created = new Date(i.createdAt);
        const resolved = new Date(i.completionDate);
        return sum + (resolved - created);
      }, 0);
      const avgDiffHours = totalDiffMs / resolvedIssues.length / (1000 * 60 * 60);
      if (avgDiffHours < 24) {
        avgText = `${avgDiffHours.toFixed(1)} hrs`;
      } else {
        avgText = `${(avgDiffHours / 24).toFixed(1)} days`;
      }
    } else {
      avgText = '0.5 days'; // Default mockup
    }

    setStats({
      totalAssets,
      openIssues: activeIssues,
      activeCost,
      avgResolutionTime: avgText,
      unsafeCount
    });

    setUnsafeAssets(unsafeList);

    // 2. Upcoming Service (Sort by next service date, exclude retired)
    const activeAssets = assets.filter(a => a.status !== 'Retired' && a.nextServiceDate);
    const sortedByService = [...activeAssets].sort((a, b) => new Date(a.nextServiceDate) - new Date(b.nextServiceDate));
    setUpcomingServices(sortedByService.slice(0, 4));

    // 3. Status Distributions
    const aCounts = {};
    assets.forEach(a => {
      aCounts[a.status] = (aCounts[a.status] || 0) + 1;
    });
    setAssetsStatusCounts(aCounts);

    const iCounts = {};
    issues.forEach(i => {
      iCounts[i.status] = (iCounts[i.status] || 0) + 1;
    });
    setIssuesStatusCounts(iCounts);
  };

  const handleAssetAlertClick = (code) => {
    setSelectedAssetCode(code);
    setActiveTab('assets');
  };

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Facilities & Asset Dashboard</h1>
          <p className="page-subtitle">Overview of system-wide operations, pending issues, and service compliance</p>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="stats-grid">
        <div className="card stat-card card-hover">
          <div className="stat-icon emerald">
            <Wrench size={24} />
          </div>
          <div>
            <div className="stat-num">{stats.totalAssets}</div>
            <div className="stat-label">Total Digital Assets</div>
          </div>
        </div>

        <div className="card stat-card card-hover">
          <div className="stat-icon warning">
            <FileText size={24} />
          </div>
          <div>
            <div className="stat-num">{stats.openIssues}</div>
            <div className="stat-label">Active Tickets</div>
          </div>
        </div>

        <div className="card stat-card card-hover">
          <div className="stat-icon info">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="stat-num">${stats.activeCost.toLocaleString()}</div>
            <div className="stat-label">Total Spend (YTD)</div>
          </div>
        </div>

        <div className="card stat-card card-hover">
          <div className="stat-icon purple">
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-num">{stats.avgResolutionTime}</div>
            <div className="stat-label">Avg Resolution Speed</div>
          </div>
        </div>
      </div>

      {/* Unsafe Out of Service Banners */}
      {stats.unsafeCount > 0 && (
        <div className="unsafe-banner">
          <div className="banner-left">
            <AlertOctagon size={28} className="text-danger" style={{ color: 'var(--danger)' }} />
            <div>
              <div className="banner-title">{stats.unsafeCount} Critical Safety Alert{stats.unsafeCount > 1 ? 's' : ''}</div>
              <div className="banner-desc">Assets are flagged as Out of Service or Unsafe. Operational lock is active.</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {unsafeAssets.slice(0, 2).map(asset => (
              <button 
                key={asset.code}
                className="btn btn-danger btn-sm"
                onClick={() => handleAssetAlertClick(asset.code)}
              >
                Inspect {asset.code}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Split Grid */}
      <div className="dashboard-split">
        {/* Left Column: Charts and Activities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Custom SVG Visualization Section */}
          <div className="card">
            <h3 className="mb-20" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} className="text-accent" style={{ color: 'var(--accent)' }} /> 
              Operational Analytics
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              {/* Asset Health Chart Card */}
              <div style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)' }}>
                <h4 className="mb-15" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ASSET STATUS INDEX</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(assetsStatusCounts).map(([status, count]) => {
                    const pct = Math.round((count / stats.totalAssets) * 100) || 0;
                    let color = 'var(--accent)';
                    if (status === 'Issue Reported') color = 'var(--warning)';
                    if (status === 'Under Inspection') color = 'var(--info)';
                    if (status === 'Under Maintenance') color = 'var(--purple)';
                    if (status === 'Out of Service') color = 'var(--danger)';
                    if (status === 'Retired') color = 'var(--gray)';

                    return (
                      <div key={status}>
                        <div className="flex-between mb-4" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          <span>{status}</span>
                          <span style={{ color }}>{count} ({pct}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '4px', transition: 'width 0.8s ease-in-out' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Issues Triage Chart Card */}
              <div style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)' }}>
                <h4 className="mb-15" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>TICKET LOAD BY WORKFLOW</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                  {Object.keys(issuesStatusCounts).length === 0 ? (
                    <div className="text-muted text-center" style={{ padding: '20px' }}>No active tickets</div>
                  ) : (
                    Object.entries(issuesStatusCounts).map(([status, count]) => {
                      let color = 'var(--info)';
                      if (status === 'Resolved' || status === 'Closed') color = 'var(--accent)';
                      if (status === 'Reported') color = 'var(--warning)';
                      if (status === 'Critical') color = 'var(--danger)';
                      if (status === 'Maintenance In Progress') color = 'var(--purple)';

                      return (
                        <div key={status} className="flex-between" style={{ padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: '6px', borderLeft: `3px solid ${color}`, fontSize: '0.8rem' }}>
                          <span style={{ fontWeight: 600 }}>{status}</span>
                          <span style={{ background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>{count}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="card">
            <h3 className="mb-15" style={{ fontWeight: 700 }}>Quick Actions</h3>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => setActiveTab('assets')}>
                Manage & Add Assets
              </button>
              <button className="btn btn-secondary" onClick={() => setActiveTab('issues')}>
                Review Maintenance Tickets
              </button>
              <button className="btn btn-secondary" onClick={() => {
                // Switch role to reporter and go to reporter tab
                document.querySelector('.role-btn.public')?.click();
              }}>
                Simulate Public Reporter QR Link
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Alerts and Timelines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Preventive Service Schedule */}
          <div className="card">
            <h3 className="mb-20" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={20} className="text-accent" style={{ color: 'var(--accent)' }} /> 
              Upcoming Maintenance
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {upcomingServices.length === 0 ? (
                <div className="text-center text-muted" style={{ padding: '30px 0' }}>
                  No services scheduled.
                </div>
              ) : (
                upcomingServices.map(asset => {
                  const today = new Date();
                  const serviceDate = new Date(asset.nextServiceDate);
                  const diffTime = serviceDate - today;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  let dateLabelColor = 'var(--text-secondary)';
                  let alertIcon = null;

                  if (diffDays < 0) {
                    dateLabelColor = 'var(--danger)';
                    alertIcon = <ShieldAlert size={14} className="text-danger" style={{ verticalAlign: 'middle', marginRight: '4px' }} />;
                  } else if (diffDays <= 7) {
                    dateLabelColor = 'var(--warning)';
                    alertIcon = <AlertTriangle size={14} className="text-warning" style={{ verticalAlign: 'middle', marginRight: '4px' }} />;
                  }

                  return (
                    <div 
                      key={asset.code}
                      className="flex-between"
                      style={{ 
                        padding: '12px 14px', 
                        background: 'var(--bg-tertiary)', 
                        borderRadius: 'var(--border-radius)', 
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleAssetAlertClick(asset.code)}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '2px' }}>{asset.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{asset.code} • {asset.location}</div>
                      </div>
                      <div className="text-right">
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: dateLabelColor, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          {alertIcon}
                          {asset.nextServiceDate}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {diffDays < 0 ? 'OVERDUE' : diffDays === 0 ? 'Due Today' : `In ${diffDays} days`}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick System Reset / Demo Help */}
          <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
            <h4 className="mb-10" style={{ fontWeight: 700, fontSize: '0.95rem' }}>Evaluating MaintainIQ</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }} className="mb-15">
              This prototype simulates a complete facility environment. Switch between roles above to simulate reports, technician assignments, inspections, parts and costs, and see the asset timelines update automatically.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', cursor: 'pointer' }} onClick={() => setActiveTab('settings')}>
              Configure Gemini API Key <ArrowRight size={14} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
