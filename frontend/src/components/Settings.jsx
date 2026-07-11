import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Settings as SettingsIcon, Save, Key, RefreshCw, AlertTriangle, Check, Sliders } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    geminiApiKey: '',
    networkLagSim: 0,
    organizationName: 'MaintainIQ Central Facilities'
  });

  const [showKey, setShowKey] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  useEffect(() => {
    setSettings(storage.getSettings());
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: name === 'networkLagSim' ? Number(value) : value
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    storage.saveSettings(settings);
    setSuccessMsg('Settings updated successfully!');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const handleResetDB = () => {
    if (window.confirm('Are you sure you want to restore the database? All custom assets, tickets, and log edits will be overwritten with the default hackathon seed data.')) {
      storage.resetDatabase();
      setSettings(storage.getSettings());
      setResetMsg('Database successfully reset to seed data!');
      
      // Force reload on a small timeout to let state refresh
      setTimeout(() => {
        setResetMsg('');
        window.location.reload();
      }, 1500);
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Configuration</h1>
          <p className="page-subtitle">Configure GenAI integrations, simulated network speeds, and organization profiles</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        
        {/* Settings Form */}
        <div className="card">
          <h3 className="mb-20" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SettingsIcon size={20} className="text-accent" style={{ color: 'var(--accent)' }} /> 
            Global Configuration
          </h3>

          {successMsg && (
            <div className="badge badge-operational mb-15" style={{ width: '100%', padding: '12px' }}>
              <Check size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSave}>
            {/* Org Name */}
            <div className="form-group">
              <label className="form-label">Organization Name (Shown on Asset Labels)</label>
              <input 
                type="text" 
                name="organizationName" 
                className="form-control" 
                required
                value={settings.organizationName} 
                onChange={handleInputChange} 
              />
            </div>

            {/* API Key */}
            <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '20px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={14} /> Google Gemini API Key
              </label>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: '1.4' }}>
                Adding a key enables live generative AI issue triage using the real Google Gemini 1.5 Flash model. 
                Your key is stored <strong>locally in your browser</strong> and is never sent to any server other than the official Google API endpoint.
              </p>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type={showKey ? "text" : "password"} 
                  name="geminiApiKey" 
                  className="form-control" 
                  placeholder="AIzaSy..." 
                  value={settings.geminiApiKey} 
                  onChange={handleInputChange}
                  style={{ fontFamily: !showKey && settings.geminiApiKey ? 'none' : 'monospace' }}
                />
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => setShowKey(!showKey)}
                  style={{ whiteSpace: 'nowrap', width: '90px' }}
                >
                  {showKey ? 'Hide Key' : 'Reveal'}
                </button>
              </div>
            </div>

            {/* Network Lag Simulator */}
            <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '20px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sliders size={14} /> AI Processing Latency Simulator
              </label>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
                Artificially delay the GenAI issue triage response. Use this to easily review and test loading screens, spinner states, and pulse badges.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <input 
                  type="range" 
                  name="networkLagSim" 
                  min="0" 
                  max="5" 
                  step="0.5"
                  className="form-control"
                  style={{ flexGrow: 1, padding: 0, height: '6px', background: 'var(--bg-tertiary)', border: 'none' }}
                  value={settings.networkLagSim} 
                  onChange={handleInputChange}
                />
                <span style={{ fontWeight: 700, minWidth: '60px', textAlign: 'right' }}>
                  {settings.networkLagSim} sec
                </span>
              </div>
            </div>

            <button type="submit" className="btn btn-primary mt-15" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Save size={16} /> Save Configurations
            </button>
          </form>
        </div>

        {/* System Reset Operations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
            <h3 className="mb-10" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
              <AlertTriangle size={20} /> Danger Zone
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }} className="mb-15">
              Reset database variables to erase custom assets and tickets and restore the clean seed dataset. Useful if you want to perform a clean walk-through demonstration.
            </p>
            
            {resetMsg && (
              <div className="badge badge-operational mb-15" style={{ padding: '8px 12px', fontSize: '0.75rem', width: '100%' }}>
                {resetMsg}
              </div>
            )}

            <button className="btn btn-danger btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={handleResetDB}>
              <RefreshCw size={14} /> Restore Initial Database Seeds
            </button>
          </div>

          <div className="card">
            <h4 className="mb-10" style={{ fontWeight: 700, fontSize: '0.9rem' }}>AI Triage Prompt Notes</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              When a custom API Key is added, the app feeds the target asset specs (category, location, recent logs) directly to Gemini along with the user complaint. The returned object parses JSON to extract diagnostic guides and safe diagnostic procedures.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
