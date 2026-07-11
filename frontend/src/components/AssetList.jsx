import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { 
  Search, 
  Filter, 
  Plus, 
  QrCode, 
  Copy, 
  ExternalLink, 
  Download, 
  Edit, 
  Printer, 
  ArrowLeft, 
  Eye, 
  ShieldAlert, 
  AlertTriangle,
  Clock,
  User,
  Wrench,
  Check
} from 'lucide-react';
import QRLabelSheet from './QRLabelSheet';

export default function AssetList({ selectedCode, setSelectedCode }) {
  const [assets, setAssets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  // Bulk Selection
  const [selectedAssetCodes, setSelectedAssetCodes] = useState([]);
  const [showBulkLabels, setShowBulkLabels] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'AV Equipment',
    location: '',
    condition: 'Good',
    serialNumber: '',
    purchaseCost: 0,
    technicianId: '',
    nextServiceDate: '',
    notes: ''
  });
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadData();
    setTechnicians(storage.getTechnicians());
  }, []);

  useEffect(() => {
    if (selectedCode) {
      const found = storage.getAssetByCode(selectedCode);
      if (found) {
        setSelectedAsset(found);
        setFormData(found);
      }
    }
  }, [selectedCode, assets]);

  const loadData = () => {
    setAssets(storage.getAssets());
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleStatusFilter = (e) => setStatusFilter(e.target.value);
  const handleCategoryFilter = (e) => setCategoryFilter(e.target.value);

  // Filtered Assets
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || asset.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || asset.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Unique lists for dropdowns
  const categories = ['AV Equipment', 'HVAC', 'IT Hardware', 'Lab Equipment', 'Facility', 'Plumbing', 'Electrical'];
  const statuses = ['Operational', 'Issue Reported', 'Under Inspection', 'Under Maintenance', 'Out of Service', 'Retired'];

  const getPublicURL = (code) => {
    return `${window.location.origin}${window.location.pathname}#/public/${code}`;
  };

  const getQRServerURL = (code) => {
    const publicUrl = getPublicURL(code);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}`;
  };

  const handleCopyLink = (code) => {
    const url = getPublicURL(code);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    });
  };

  const handleSelectAsset = (asset) => {
    setSelectedAsset(asset);
    setSelectedCode(asset.code);
    setFormData(asset);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleCloseDetail = () => {
    setSelectedAsset(null);
    setSelectedCode('');
    setShowEditForm(false);
  };

  // Form Inputs Handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'purchaseCost' ? Math.max(0, Number(value)) : value
    }));
  };

  // Create Asset
  const handleAddSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.name || !formData.code || !formData.location) {
      setErrorMsg('Name, Unique Code, and Location are required fields.');
      return;
    }

    try {
      storage.addAsset(formData);
      setSuccessMsg('Asset registered successfully!');
      loadData();
      // Clear form
      setFormData({
        name: '',
        code: '',
        category: 'AV Equipment',
        location: '',
        condition: 'Good',
        serialNumber: '',
        purchaseCost: 0,
        technicianId: '',
        nextServiceDate: '',
        notes: ''
      });
      setTimeout(() => {
        setShowAddForm(false);
        setSuccessMsg('');
      }, 1500);
    } catch (e) {
      setErrorMsg(e.message);
    }
  };

  // Edit Asset
  const handleEditSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      storage.updateAsset(selectedAsset.code, formData);
      setSuccessMsg('Asset updated successfully!');
      loadData();
      setTimeout(() => {
        setShowEditForm(false);
        setSelectedAsset(storage.getAssetByCode(selectedAsset.code));
        setSuccessMsg('');
      }, 1500);
    } catch (e) {
      setErrorMsg(e.message);
    }
  };

  // Bulk Checkbox handlers
  const handleToggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedAssetCodes(filteredAssets.map(a => a.code));
    } else {
      setSelectedAssetCodes([]);
    }
  };

  const handleToggleSelectAsset = (code) => {
    setSelectedAssetCodes(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Operational': return 'badge-operational';
      case 'Issue Reported': return 'badge-issue-reported';
      case 'Under Inspection': return 'badge-under-inspection';
      case 'Under Maintenance': return 'badge-under-maintenance';
      case 'Out of Service': return 'badge-out-of-service';
      case 'Retired': return 'badge-retired';
      default: return 'badge-operational';
    }
  };

  if (showBulkLabels) {
    return (
      <QRLabelSheet 
        selectedCodes={selectedAssetCodes} 
        onBack={() => setShowBulkLabels(false)} 
      />
    );
  }

  return (
    <div className="asset-list-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Digital Asset Directory</h1>
          <p className="page-subtitle">Add, edit, inspect assets, and generate QR labels for physical tagging</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {selectedAssetCodes.length > 0 && (
            <button className="btn btn-secondary" onClick={() => setShowBulkLabels(true)}>
              <Printer size={16} /> Print Selected Labels ({selectedAssetCodes.length})
            </button>
          )}
          <button className="btn btn-primary" onClick={() => {
            setShowAddForm(true);
            setFormData({
              name: '',
              code: '',
              category: 'AV Equipment',
              location: '',
              condition: 'Good',
              serialNumber: '',
              purchaseCost: 0,
              technicianId: '',
              nextServiceDate: '',
              notes: ''
            });
            setErrorMsg('');
          }}>
            <Plus size={16} /> Register Asset
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card mb-20" style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Search */}
          <div style={{ flexGrow: 1, position: 'relative', minWidth: '240px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by name, code, location..." 
              value={searchTerm}
              onChange={handleSearch}
              style={{ paddingLeft: '40px' }}
            />
          </div>

          {/* Filter Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} className="text-muted" style={{ color: 'var(--text-muted)' }} />
            <select className="form-control" value={statusFilter} onChange={handleStatusFilter} style={{ padding: '8px 12px', width: '160px' }}>
              <option value="All">All Statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Filter Category */}
          <div>
            <select className="form-control" value={categoryFilter} onChange={handleCategoryFilter} style={{ padding: '8px 12px', width: '180px' }}>
              <option value="All">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

        </div>
      </div>

      {/* Assets Table */}
      <div className="card">
        {filteredAssets.length === 0 ? (
          <div className="text-center text-muted" style={{ padding: '60px 0' }}>
            <QrCode size={48} className="mb-15" style={{ strokeWidth: '1' }} />
            <h3>No assets found</h3>
            <p>Try modifying your search or filters, or register a new asset.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <label className="checkbox-container">
                      <input 
                        type="checkbox" 
                        onChange={handleToggleSelectAll}
                        checked={selectedAssetCodes.length === filteredAssets.length && filteredAssets.length > 0} 
                      />
                      <span className="checkmark"></span>
                    </label>
                  </th>
                  <th>Asset Code</th>
                  <th>Asset Name</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Condition</th>
                  <th>Status</th>
                  <th>Next Service</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(asset => {
                  const isChecked = selectedAssetCodes.includes(asset.code);
                  return (
                    <tr key={asset.code} style={{ cursor: 'pointer' }} onClick={() => handleSelectAsset(asset)}>
                      <td onClick={(e) => e.stopPropagation()}>
                        <label className="checkbox-container">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => handleToggleSelectAsset(asset.code)}
                          />
                          <span className="checkmark"></span>
                        </label>
                      </td>
                      <td style={{ fontWeight: 700 }}>{asset.code}</td>
                      <td style={{ fontWeight: 600 }}>{asset.name}</td>
                      <td>{asset.category}</td>
                      <td>{asset.location}</td>
                      <td>
                        <span style={{ 
                          fontWeight: 600, 
                          color: asset.condition === 'Good' ? 'var(--accent)' : asset.condition === 'Fair' ? 'var(--info)' : asset.condition === 'Poor' ? 'var(--warning)' : 'var(--danger)'
                        }}>
                          {asset.condition}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(asset.status)}`}>
                          {asset.status}
                        </span>
                      </td>
                      <td>{asset.nextServiceDate || 'Not Scheduled'}</td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleSelectAsset(asset)}>
                            <Eye size={14} /> View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Asset Modal Panel */}
      {showAddForm && (
        <div className="detail-panel-backdrop" onClick={() => setShowAddForm(false)}>
          <div className="detail-panel" onClick={(e) => e.stopPropagation()} style={{ width: '560px' }}>
            <div className="flex-between mb-20">
              <h2 style={{ fontWeight: 700 }}>Register New Asset</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddForm(false)}>Close</button>
            </div>

            {errorMsg && <div className="unsafe-banner mb-15" style={{ padding: '10px 14px' }}><div className="banner-left"><span style={{ fontWeight: 700, color: 'var(--danger)' }}>{errorMsg}</span></div></div>}
            {successMsg && <div className="badge badge-operational mb-15" style={{ width: '100%', padding: '12px' }}>{successMsg}</div>}

            <form onSubmit={handleAddSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Asset Name *</label>
                  <input type="text" name="name" className="form-control" required value={formData.name} onChange={handleInputChange} placeholder="e.g. Lobby Air Conditioner" />
                </div>
                <div className="form-group">
                  <label className="form-label">Unique Asset Code *</label>
                  <input type="text" name="code" className="form-control" required value={formData.code} onChange={handleInputChange} placeholder="e.g. LOBBY-AC-02" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select name="category" className="form-control" value={formData.category} onChange={handleInputChange}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Location *</label>
                  <input type="text" name="location" className="form-control" required value={formData.location} onChange={handleInputChange} placeholder="e.g. Main Lobby, Floor 1" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Condition</label>
                  <select name="condition" className="form-control" value={formData.condition} onChange={handleInputChange}>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Unsafe">Unsafe</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Next Service Date</label>
                  <input type="date" name="nextServiceDate" className="form-control" value={formData.nextServiceDate} onChange={handleInputChange} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Serial Number</label>
                  <input type="text" name="serialNumber" className="form-control" value={formData.serialNumber} onChange={handleInputChange} placeholder="Private - e.g. SN-AC-1029B" />
                </div>
                <div className="form-group">
                  <label className="form-label">Purchase Cost ($)</label>
                  <input type="number" name="purchaseCost" className="form-control" value={formData.purchaseCost} onChange={handleInputChange} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Maintenance Technician</label>
                <select name="technicianId" className="form-control" value={formData.technicianId} onChange={handleInputChange}>
                  <option value="">No technician assigned</option>
                  {technicians.map(t => <option key={t.id} value={t.id}>{t.name} ({t.specialty})</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Internal Private Notes</label>
                <textarea name="notes" className="form-control" rows="3" value={formData.notes} onChange={handleInputChange} placeholder="Private notes, wiring specifics, etc. (Not shown on public page)"></textarea>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }}>Register Asset</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset Detail Slider Drawer */}
      {selectedAsset && (
        <>
          <div className="detail-panel-backdrop" onClick={handleCloseDetail}></div>
          <div className="detail-panel">
            
            {/* Header */}
            <div className="flex-between mb-20" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
              <div>
                <span className={`badge ${getStatusBadgeClass(selectedAsset.status)} mb-4`}>
                  {selectedAsset.status}
                </span>
                <h2 style={{ fontWeight: 800, fontSize: '1.4rem' }}>{selectedAsset.name}</h2>
                <code style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedAsset.code}</code>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleCloseDetail}>Close</button>
            </div>

            {successMsg && <div className="badge badge-operational mb-15" style={{ width: '100%', padding: '10px' }}>{successMsg}</div>}

            {/* Display Mode / Edit Mode Toggle */}
            {!showEditForm ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                
                {/* QR Code and Actions Card */}
                <div className="card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div className="qr-image-wrapper" style={{ width: '120px', height: '120px', padding: '8px' }}>
                      <img 
                        src={getQRServerURL(selectedAsset.code)} 
                        alt="QR Code"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div className="asset-label-org">QR Maintenance Entry</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                        {getPublicURL(selectedAsset.code)}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleCopyLink(selectedAsset.code)}>
                          {copiedCode === selectedAsset.code ? <Check size={12} className="text-accent" /> : <Copy size={12} />}
                          {copiedCode === selectedAsset.code ? 'Copied!' : 'Copy Link'}
                        </button>
                        
                        <a 
                          href={getPublicURL(selectedAsset.code)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          <ExternalLink size={12} /> Open Public Page
                        </a>
                      </div>

                      <a 
                        href={getQRServerURL(selectedAsset.code)}
                        download={`QR-${selectedAsset.code}.png`}
                        target="_blank"
                        className="btn btn-primary btn-sm mt-4"
                        style={{ width: 'fit-content', color: '#fff' }}
                      >
                        <Download size={12} /> Download QR Code
                      </a>
                    </div>
                  </div>
                </div>

                {/* Print Preview Asset Label */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span className="form-label" style={{ marginBottom: 0 }}>Printable QR Asset Label Preview</span>
                  <div style={{ display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '12px' }}>
                    <div className="asset-label-card">
                      <div className="asset-label-org">MaintainIQ Facility Asset</div>
                      <div className="asset-label-title">{selectedAsset.name}</div>
                      <div className="qr-image-wrapper" style={{ width: '110px', height: '110px', padding: '6px' }}>
                        <img src={getQRServerURL(selectedAsset.code)} alt="QR Label" style={{ width: '100%', height: '100%' }} />
                      </div>
                      <div className="asset-label-instruction">Scan to Report Issue / View History</div>
                      <div className="asset-label-meta">
                        <div>Code: <strong>{selectedAsset.code}</strong></div>
                        <div>Loc: <strong>{selectedAsset.location}</strong></div>
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-secondary btn-sm mt-4" onClick={() => {
                    setSelectedAssetCodes([selectedAsset.code]);
                    setShowBulkLabels(true);
                  }}>
                    <Printer size={12} /> Print Asset Label
                  </button>
                </div>

                {/* Safe Public Information */}
                <div>
                  <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }} className="mb-10">Safe Public Info</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '0.85rem' }}>
                    <div>
                      <span className="text-muted">Category:</span>
                      <p style={{ fontWeight: 600, marginTop: '2px' }}>{selectedAsset.category}</p>
                    </div>
                    <div>
                      <span className="text-muted">Location:</span>
                      <p style={{ fontWeight: 600, marginTop: '2px' }}>{selectedAsset.location}</p>
                    </div>
                    <div>
                      <span className="text-muted">Current Condition:</span>
                      <p style={{ fontWeight: 600, marginTop: '2px' }}>{selectedAsset.condition}</p>
                    </div>
                    <div>
                      <span className="text-muted">Last Service Date:</span>
                      <p style={{ fontWeight: 600, marginTop: '2px' }}>{selectedAsset.lastServiceDate || 'Never'}</p>
                    </div>
                    <div>
                      <span className="text-muted">Next Service Date:</span>
                      <p style={{ fontWeight: 600, marginTop: '2px' }}>{selectedAsset.nextServiceDate || 'Not scheduled'}</p>
                    </div>
                  </div>
                </div>

                {/* Private Administrative Details */}
                <div style={{ background: 'rgba(239, 68, 68, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning)' }} className="mb-10">
                    <ShieldAlert size={16} /> Private Administrative Data
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '0.85rem' }} className="mb-15">
                    <div>
                      <span className="text-muted">Serial Number:</span>
                      <p style={{ fontWeight: 600, marginTop: '2px' }}>{selectedAsset.serialNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-muted">Acquisition Cost:</span>
                      <p style={{ fontWeight: 600, marginTop: '2px' }}>${(selectedAsset.purchaseCost || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem' }}>
                    <span className="text-muted">Private Operations Notes:</span>
                    <p style={{ marginTop: '4px', background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {selectedAsset.notes || 'No private notes.'}
                    </p>
                  </div>
                </div>

                {/* Edit Toggle */}
                <button className="btn btn-secondary" onClick={() => {
                  setShowEditForm(true);
                  setFormData(selectedAsset);
                }}>
                  <Edit size={16} /> Edit Asset Specifications
                </button>

                {/* Asset History Timeline */}
                <div>
                  <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }} className="mb-10">Asset Service & Log History</h3>
                  <div className="timeline">
                    {storage.getHistoryForAsset(selectedAsset.code).length === 0 ? (
                      <div className="text-muted text-center" style={{ fontSize: '0.85rem', padding: '15px 0' }}>
                        No recorded log history for this asset yet.
                      </div>
                    ) : (
                      storage.getHistoryForAsset(selectedAsset.code).map((h, i) => (
                        <div key={h.id} className="timeline-item">
                          <div className={`timeline-dot ${i === 0 ? 'active' : ''}`}></div>
                          <div className="timeline-content">
                            <div className="timeline-time">{new Date(h.date).toLocaleString()}</div>
                            <div className="mb-4">
                              <span className="timeline-actor">{h.actor}</span>: <strong style={{ color: 'var(--accent)' }}>{h.action}</strong>
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{h.notes}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            ) : (
              // Edit Form Mode
              <form onSubmit={handleEditSubmit}>
                {errorMsg && <div className="unsafe-banner mb-15"><div className="banner-left"><span style={{ color: 'var(--danger)' }}>{errorMsg}</span></div></div>}
                
                <div className="form-group">
                  <label className="form-label">Asset Name</label>
                  <input type="text" name="name" className="form-control" required value={formData.name} onChange={handleInputChange} />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select name="category" className="form-control" value={formData.category} onChange={handleInputChange}>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input type="text" name="location" className="form-control" required value={formData.location} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Condition</label>
                    <select name="condition" className="form-control" value={formData.condition} onChange={handleInputChange}>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                      <option value="Unsafe">Unsafe</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status Override</label>
                    <select name="status" className="form-control" value={formData.status} onChange={handleInputChange}>
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Serial Number</label>
                    <input type="text" name="serialNumber" className="form-control" value={formData.serialNumber} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Purchase Cost ($)</label>
                    <input type="number" name="purchaseCost" className="form-control" value={formData.purchaseCost} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Next Service Date</label>
                  <input type="date" name="nextServiceDate" className="form-control" value={formData.nextServiceDate || ''} onChange={handleInputChange} />
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Technician</label>
                  <select name="technicianId" className="form-control" value={formData.technicianId || ''} onChange={handleInputChange}>
                    <option value="">No technician assigned</option>
                    {technicians.map(t => <option key={t.id} value={t.id}>{t.name} ({t.specialty})</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Private Notes</label>
                  <textarea name="notes" className="form-control" rows="3" value={formData.notes || ''} onChange={handleInputChange}></textarea>
                </div>

                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }}>Save Changes</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditForm(false)}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
