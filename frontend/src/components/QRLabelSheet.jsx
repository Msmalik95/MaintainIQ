import React, { useEffect, useState } from 'react';
import { storage } from '../services/storage';
import { ArrowLeft, Printer } from 'lucide-react';

export default function QRLabelSheet({ selectedCodes, onBack }) {
  const [assets, setAssets] = useState([]);
  const [orgName, setOrgName] = useState('MaintainIQ Central Facilities');

  useEffect(() => {
    const allAssets = storage.getAssets();
    const selected = allAssets.filter(a => selectedCodes.includes(a.code));
    setAssets(selected);

    const settings = storage.getSettings();
    if (settings.organizationName) {
      setOrgName(settings.organizationName);
    }
  }, [selectedCodes]);

  const handlePrint = () => {
    window.print();
  };

  const getQRServerURL = (code) => {
    const publicUrl = `${window.location.origin}${window.location.pathname}#/public/${code}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publicUrl)}`;
  };

  return (
    <div className="qr-label-sheet-page">
      {/* Non-Printable Header Actions */}
      <div className="page-header print-hide" style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
        <div>
          <button className="btn btn-secondary mb-10" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={16} /> Back to Directory
          </button>
          <h1 className="page-title">Asset Label Sheet</h1>
          <p className="page-subtitle">Print this sheet of digital tags. Labels are sized for standard physical application.</p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={handlePrint} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
            <Printer size={18} /> Print Label Sheet
          </button>
        </div>
      </div>

      {/* Printable Grid */}
      <div className="bulk-labels-grid-container">
        {assets.length === 0 ? (
          <div className="text-center text-muted" style={{ padding: '40px' }}>
            No assets selected for labeling.
          </div>
        ) : (
          <div className="bulk-labels-grid">
            {assets.map(asset => (
              <div key={asset.code} className="asset-label-card print-card-override" style={{ margin: '10px auto' }}>
                <div className="asset-label-org">{orgName}</div>
                <div className="asset-label-title" style={{ fontSize: '1rem', height: '2.4em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {asset.name}
                </div>
                <div className="qr-image-wrapper" style={{ width: '120px', height: '120px', padding: '8px', background: '#fff' }}>
                  <img 
                    src={getQRServerURL(asset.code)} 
                    alt={`QR Code ${asset.code}`} 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div className="asset-label-instruction" style={{ fontSize: '0.7rem' }}>
                  Scan code to report issue or inspect history
                </div>
                <div className="asset-label-meta" style={{ padding: '6px 0 0 0', marginTop: '6px', fontSize: '0.75rem' }}>
                  <div>Code: <strong>{asset.code}</strong></div>
                  <div>Loc: <strong>{asset.location}</strong></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Embedded CSS Print Overrides */}
      <style>{`
        @media print {
          /* Hide non-printable elements */
          .print-hide,
          .role-simulation-bar,
          .sidebar,
          .btn,
          button,
          .theme-toggle-btn,
          .page-header {
            display: none !important;
          }
          
          /* Remove content margins and scrollings */
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .content-area {
            margin-left: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          
          .main-wrapper {
            margin-top: 0 !important;
          }
          
          /* Printable Grid Alignment */
          .bulk-labels-grid-container {
            padding: 0 !important;
          }

          .bulk-labels-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 15px !important;
            padding: 0 !important;
          }
          
          /* Force card size and borders for clean cuts */
          .print-card-override {
            border: 1px dashed #000 !important;
            background: white !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            color: black !important;
          }

          .print-card-override .asset-label-org,
          .print-card-override .asset-label-meta,
          .print-card-override .asset-label-instruction {
            color: black !important;
          }

          .print-card-override .qr-image-wrapper {
            box-shadow: none !important;
            border: 1px solid #ccc !important;
          }
        }
      `}</style>
    </div>
  );
}
