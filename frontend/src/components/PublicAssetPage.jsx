import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { runAITriage } from '../services/ai';
import { 
  QrCode, 
  AlertTriangle, 
  CheckCircle, 
  User, 
  Mail, 
  Camera, 
  RefreshCw, 
  FileText, 
  Calendar,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function PublicAssetPage({ urlAssetCode }) {
  const [assetCode, setAssetCode] = useState(urlAssetCode || '');
  const [asset, setAsset] = useState(null);
  const [safeHistory, setSafeHistory] = useState([]);
  const [isReporting, setIsReporting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);
  
  // Simulated Camera Scanner State
  const [simulatingScan, setSimulatingScan] = useState(false);
  const [scanSelection, setScanSelection] = useState('');

  // AI Triage States
  const [complaintText, setComplaintText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTriageResult, setAiTriageResult] = useState(null);

  // Form Field States & Edit Tracking
  const [formFields, setFormFields] = useState({
    title: '',
    category: 'AV Equipment',
    priority: 'Medium',
    reporterName: '',
    reporterContact: '',
    description: '',
    evidenceImage: ''
  });
  
  const [originalAiFields, setOriginalAiFields] = useState({
    title: '',
    category: '',
    priority: ''
  });
  
  const [editedFields, setEditedFields] = useState({
    title: false,
    category: false,
    priority: false
  });

  const [formError, setFormError] = useState('');

  useEffect(() => {
    // If code is provided in URL, load it
    if (urlAssetCode) {
      loadAsset(urlAssetCode);
    }
  }, [urlAssetCode]);

  const loadAsset = (code) => {
    const foundAsset = storage.getAssetByCode(code);
    if (foundAsset) {
      setAsset(foundAsset);
      setAssetCode(foundAsset.code);
      
      // Filter safe history logs (exclude internal details, costs, technician lists)
      const history = storage.getHistoryForAsset(foundAsset.code);
      const safe = history.map(h => {
        let action = h.action;
        let notes = h.notes;
        
        // Hide technician assignments, sensitive notes, costs
        if (action === 'Technician Assigned') {
          action = 'Staff Assigned';
          notes = 'A technician has been dispatched to inspect the issue.';
        } else if (action === 'Asset Registered') {
          notes = 'Asset registered in database.';
        } else if (action === 'Issue Status Changed' && notes.includes('status changed')) {
          const toStatus = notes.split('to')[1]?.trim();
          notes = `Request progressed to status: ${toStatus}`;
        } else if (action === 'Maintenance Resolved') {
          notes = 'Maintenance resolved successfully. Operational status certified.';
        }

        return { ...h, action, notes };
      });
      setSafeHistory(safe);
      setIsReporting(false);
      setSubmittedTicket(null);
      setAiTriageResult(null);
    } else {
      setAsset(null);
    }
  };

  const handleSimulateScan = (e) => {
    e.preventDefault();
    if (!scanSelection) return;
    setSimulatingScan(true);
    // Simulate camera lock delay
    setTimeout(() => {
      setSimulatingScan(false);
      window.location.hash = `/public/${scanSelection}`;
      loadAsset(scanSelection);
    }, 1500);
  };

  const handleRunAITriage = async () => {
    if (!complaintText.trim()) {
      setFormError('Please type in a description of the issue first.');
      return;
    }
    
    setFormError('');
    setAiLoading(true);
    setAiTriageResult(null);

    const assetContext = {
      name: asset.name,
      code: asset.code,
      category: asset.category,
      location: asset.location,
      condition: asset.condition,
      lastServiceDate: asset.lastServiceDate,
      recentHistory: safeHistory.slice(0, 2)
    };

    try {
      const triage = await runAITriage(complaintText, assetContext);
      
      setAiTriageResult(triage);
      setFormFields(prev => ({
        ...prev,
        title: triage.title || '',
        category: triage.category || asset.category,
        priority: triage.priority || 'Medium',
        description: complaintText
      }));

      // Cache original values to check for manual edits
      setOriginalAiFields({
        title: triage.title || '',
        category: triage.category || asset.category,
        priority: triage.priority || 'Medium'
      });

      setEditedFields({
        title: false,
        category: false,
        priority: false
      });
      
    } catch (err) {
      console.error(err);
      setFormError('AI Triage failed. Please fill out details manually.');
    } finally {
      setAiLoading(false);
    }
  };

  // Form change tracking to identify manual modifications to AI suggestions
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormFields(prev => ({
      ...prev,
      [name]: value
    }));

    if (aiTriageResult) {
      const originallySuggested = originalAiFields[name];
      const isModified = originallySuggested && value !== originallySuggested;
      
      setEditedFields(prev => ({
        ...prev,
        [name]: isModified
      }));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formFields.title || !formFields.description) {
      setFormError('Issue Title and Description are required.');
      return;
    }

    const payload = {
      assetCode: asset.code,
      title: formFields.title,
      description: formFields.description,
      priority: formFields.priority,
      category: formFields.category,
      reporterName: formFields.reporterName,
      reporterContact: formFields.reporterContact,
      evidenceImage: formFields.evidenceImage,
      isAISuggested: !!aiTriageResult,
      isAIEdited: editedFields.title || editedFields.category || editedFields.priority,
      possibleCauses: aiTriageResult?.possibleCauses || [],
      initialChecks: aiTriageResult?.initialChecks || []
    };

    try {
      const ticket = storage.addIssue(payload);
      setSubmittedTicket(ticket);
      
      // Update asset condition to Poor if critical
      if (formFields.priority === 'Critical') {
        storage.updateAsset(asset.code, { condition: 'Unsafe', status: 'Out of Service' });
      }
      
      // Reload asset specs in background
      setAsset(storage.getAssetByCode(asset.code));
    } catch (err) {
      setFormError(err.message);
    }
  };

  // Checkbox simulator image load
  const handleImageInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormFields(prev => ({ ...prev, evidenceImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Safe condition colors
  const getConditionColor = (cond) => {
    if (cond === 'Good') return 'var(--accent)';
    if (cond === 'Fair') return 'var(--info)';
    if (cond === 'Poor') return 'var(--warning)';
    return 'var(--danger)';
  };

  // Renders Simulated QR Scanner Home Page
  if (!assetCode) {
    const allAssets = storage.getAssets();
    return (
      <div className="public-container">
        <div className="public-header">
          <div className="public-logo">MaintainIQ Public Portal</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Scan a QR code on an asset or choose one below to simulate scanning a tag.</p>
        </div>

        {simulatingScan ? (
          <div className="card">
            <div className="scanner-sim-camera">
              <Camera size={36} className="mb-15" />
              <div className="scanner-scan-line"></div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>Accessing camera feed...</p>
              <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '4px' }}>Locating QR pattern code</p>
            </div>
          </div>
        ) : (
          <div className="card">
            <h3 className="mb-15" style={{ fontWeight: 700 }}>Choose Tag to Scan</h3>
            <form onSubmit={handleSimulateScan}>
              <div className="form-group">
                <label className="form-label">Available Physical Assets</label>
                <select 
                  className="form-control" 
                  value={scanSelection} 
                  onChange={(e) => setScanSelection(e.target.value)}
                  required
                >
                  <option value="">-- Select Tag to scan --</option>
                  {allAssets.map(a => (
                    <option key={a.code} value={a.code}>{a.code} - {a.name} ({a.location})</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={16} /> Simulate QR Tag Scan
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  // Renders Asset Not Found Page
  if (assetCode && !asset) {
    return (
      <div className="public-container text-center" style={{ paddingTop: '60px' }}>
        <AlertTriangle size={64} className="text-danger mb-20" style={{ color: 'var(--danger)', margin: '0 auto' }} />
        <h2 style={{ fontWeight: 800 }}>Asset Not Registered</h2>
        <p className="text-muted mt-10" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
          The code <code>{assetCode}</code> is not registered inside the MaintainIQ system. 
          Please contact facilities management or verify the URL scan token.
        </p>
        <button className="btn btn-secondary mt-20" onClick={() => {
          window.location.hash = '';
          setAssetCode('');
        }}>
          Scan Another Asset
        </button>
      </div>
    );
  }

  // Renders Successful Issue Submission Confirmation Page
  if (submittedTicket) {
    return (
      <div className="public-container" style={{ paddingTop: '40px' }}>
        <div className="card text-center" style={{ borderTop: '4px solid var(--accent)' }}>
          <CheckCircle size={56} className="text-accent mb-15" style={{ color: 'var(--accent)', margin: '0 auto' }} />
          <h2 style={{ fontWeight: 800 }}>Ticket Logged Successfully</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }} className="mb-20">
            Your maintenance report has been added to the facilities management queue.
          </p>

          <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px', textAlign: 'left', fontSize: '0.85rem' }} className="mb-20">
            <div className="flex-between mb-4">
              <span className="text-muted">Ticket ID:</span>
              <strong style={{ color: 'var(--accent)' }}>{submittedTicket.id}</strong>
            </div>
            <div className="flex-between mb-4">
              <span className="text-muted">Asset Code:</span>
              <strong>{submittedTicket.assetCode}</strong>
            </div>
            <div className="flex-between mb-4">
              <span className="text-muted">Reported Priority:</span>
              <span style={{ fontWeight: 700, color: submittedTicket.priority === 'Critical' ? 'var(--danger)' : 'inherit' }}>{submittedTicket.priority}</span>
            </div>
            <div>
              <span className="text-muted">Title:</span>
              <p style={{ fontWeight: 600, marginTop: '2px' }}>{submittedTicket.title}</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn btn-primary" onClick={() => {
              setSubmittedTicket(null);
              setIsReporting(false);
              setAiTriageResult(null);
              setComplaintText('');
              setFormFields({
                title: '',
                category: 'AV Equipment',
                priority: 'Medium',
                reporterName: '',
                reporterContact: '',
                description: '',
                evidenceImage: ''
              });
            }}>
              Return to Asset Specs
            </button>
            <button className="btn btn-secondary" onClick={() => {
              window.location.hash = '';
              setAssetCode('');
            }}>
              Scan Another Tag
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renders Main Reporter Submission Form Page
  if (isReporting) {
    return (
      <div className="public-container">
        <div className="card">
          <h2 style={{ fontWeight: 800, fontSize: '1.25rem' }} className="mb-10">Report Issue: {asset.name}</h2>
          <code style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Asset Reference: {asset.code}</code>

          {formError && (
            <div className="unsafe-banner mt-15" style={{ padding: '10px 14px' }}>
              <div className="banner-left">
                <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{formError}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="mt-20">
            
            {/* Step A: Natural Language complaint input */}
            <div className="form-group">
              <label className="form-label">What is wrong with the equipment? *</label>
              <textarea 
                className="form-control" 
                rows="3" 
                required
                placeholder="Explain in plain language. e.g., 'The projector screen is blinking with noise and won't detect the HDMI input...'"
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                disabled={aiLoading}
              ></textarea>
              
              <button 
                type="button" 
                className="btn btn-secondary btn-sm mt-10" 
                onClick={handleRunAITriage}
                disabled={aiLoading || !complaintText.trim()}
                style={{ width: '100%', background: 'var(--accent-light)', borderColor: 'var(--accent)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {aiLoading ? (
                  <span className="ai-pulse-loader">
                    <span className="ai-pulse-dot"></span>
                    <span className="ai-pulse-dot"></span>
                    <span className="ai-pulse-dot"></span>
                    Running AI Diagnostics...
                  </span>
                ) : (
                  <>
                    <Sparkles size={14} className="text-accent" style={{ color: 'var(--accent)' }} /> 
                    Analyze Complaint with GenAI
                  </>
                )}
              </button>
            </div>

            {/* AI Response Display Box */}
            {aiTriageResult && (
              <div className="ai-triage-card mb-20" style={{ border: '1px dashed var(--accent)' }}>
                <div className="flex-between mb-10">
                  <span className="ai-suggested-tag">
                    <Sparkles size={10} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                    AI Diagnostic suggestion
                  </span>
                  {aiTriageResult.isMocked && <span className="badge badge-low" style={{ fontSize: '0.6rem' }}>Mock AI</span>}
                </div>

                {/* Causes & Checks */}
                <div className="mb-10">
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>Suspected Failures:</span>
                  <ul style={{ paddingLeft: '15px', marginTop: '3px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {aiTriageResult.possibleCauses?.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>Recommended Immediate Checks:</span>
                  <ul style={{ paddingLeft: '15px', marginTop: '3px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {aiTriageResult.initialChecks?.map((c, i) => (
                      <li key={i} style={{ 
                        color: c.startsWith('SAFETY') || triageHazardWarningActive(c) ? 'var(--danger)' : 'var(--text-secondary)',
                        fontWeight: c.startsWith('SAFETY') || triageHazardWarningActive(c) ? 'bold' : 'normal'
                      }}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Structured Fields (Editable by user) */}
            <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }} className="mb-20">
              <h4 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)' }} className="mb-15">REVIEW CLASSIFICATION SPECS</h4>
              
              {/* Ticket Title */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                  <span>Issue Summary Title *</span>
                  {aiTriageResult && (
                    <span className={editedFields.title ? "ai-edited-tag" : "ai-suggested-tag"}>
                      AI {editedFields.title ? 'Edited' : 'Suggested'}
                    </span>
                  )}
                </label>
                <input 
                  type="text" 
                  name="title" 
                  className="form-control" 
                  required
                  placeholder="e.g. Broken screen display" 
                  value={formFields.title}
                  onChange={handleFieldChange}
                />
              </div>

              {/* Category & Priority */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                    <span>Category</span>
                    {aiTriageResult && (
                      <span className={editedFields.category ? "ai-edited-tag" : "ai-suggested-tag"}>
                        AI {editedFields.category ? 'Edited' : 'Suggested'}
                      </span>
                    )}
                  </label>
                  <select 
                    name="category" 
                    className="form-control" 
                    value={formFields.category}
                    onChange={handleFieldChange}
                  >
                    <option value="AV Equipment">AV Equipment</option>
                    <option value="HVAC">HVAC</option>
                    <option value="IT Hardware">IT Hardware</option>
                    <option value="Lab Equipment">Lab Equipment</option>
                    <option value="Facility">Facility</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                    <span>Priority Level</span>
                    {aiTriageResult && (
                      <span className={editedFields.priority ? "ai-edited-tag" : "ai-suggested-tag"}>
                        AI {editedFields.priority ? 'Edited' : 'Suggested'}
                      </span>
                    )}
                  </label>
                  <select 
                    name="priority" 
                    className="form-control" 
                    value={formFields.priority}
                    onChange={handleFieldChange}
                  >
                    <option value="Low">Low (Maintenance)</option>
                    <option value="Medium">Medium (Attention needed)</option>
                    <option value="High">High (Urgent action)</option>
                    <option value="Critical">Critical (Safety hazard / Out of Service)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reporter Contact Info */}
            <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }} className="mb-20">
              <h4 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)' }} className="mb-15">REPORTER INFORMATION</h4>
              
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Your Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      name="reporterName" 
                      className="form-control" 
                      placeholder="John Doe" 
                      value={formFields.reporterName}
                      onChange={handleFieldChange}
                      style={{ paddingLeft: '36px' }}
                    />
                  </div>
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email / Contact</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      name="reporterContact" 
                      className="form-control" 
                      placeholder="john@example.com" 
                      value={formFields.reporterContact}
                      onChange={handleFieldChange}
                      style={{ paddingLeft: '36px' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Evidence Image */}
            <div className="form-group">
              <label className="form-label">Attach Photo Evidence (Optional)</label>
              <input type="file" accept="image/*" className="form-control" style={{ padding: '8px 12px' }} onChange={handleImageInput} />
              {formFields.evidenceImage && (
                <div className="mt-10" style={{ textAlign: 'center' }}>
                  <img 
                    src={formFields.evidenceImage} 
                    alt="Preview" 
                    style={{ maxWidth: '100%', maxHeight: '140px', borderRadius: '8px', border: '1px solid var(--border-color)' }} 
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
              <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }}>Submit Maintenance Request</button>
              <button type="button" className="btn btn-secondary" onClick={() => setIsReporting(false)}>Cancel</button>
            </div>

          </form>
        </div>
      </div>
    );
  }

  // Renders Safe Public Asset Landing Page (Details View)
  const isRetired = asset.status === 'Retired';
  const isOutOfService = asset.status === 'Out of Service';

  // Quick hazard check helper
  function triageHazardWarningActive(text) {
    return text.toLowerCase().includes('safety alert') || text.toLowerCase().includes('hazard') || text.toLowerCase().includes('unsafe');
  }

  return (
    <div className="public-container">
      {/* Mobile Landing specs */}
      <div className="card text-center" style={{ 
        borderTop: isRetired ? '5px solid var(--gray)' : isOutOfService ? '5px solid var(--danger)' : '5px solid var(--accent)' 
      }}>
        <div className="public-logo" style={{ color: isRetired ? 'var(--gray)' : isOutOfService ? 'var(--danger)' : 'var(--accent)' }}>
          MaintainIQ Portal
        </div>
        
        {isRetired ? (
          <div className="badge badge-retired mb-10" style={{ margin: '0 auto', display: 'flex', gap: '4px' }}>
            <ShieldAlert size={12} /> RETIRED ASSET
          </div>
        ) : isOutOfService ? (
          <div className="badge badge-out-of-service mb-10" style={{ margin: '0 auto', display: 'flex', gap: '4px' }}>
            <ShieldAlert size={12} /> OUT OF SERVICE / UNSAFE
          </div>
        ) : (
          <div className="badge badge-operational mb-10" style={{ margin: '0 auto', display: 'flex', gap: '4px' }}>
            <ShieldCheck size={12} /> OPERATIONAL
          </div>
        )}

        <h2 style={{ fontWeight: 800, fontSize: '1.4rem', marginTop: '10px' }}>{asset.name}</h2>
        <code style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{asset.code}</code>

        {/* Action Button */}
        {!isRetired && (
          <button 
            className="btn btn-primary mt-20" 
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => {
              setIsReporting(true);
              setFormFields({
                title: '',
                category: asset.category,
                priority: 'Medium',
                reporterName: '',
                reporterContact: '',
                description: '',
                evidenceImage: ''
              });
              setComplaintText('');
              setFormError('');
            }}
          >
            <AlertTriangle size={18} /> Report Malfunction or Issue
          </button>
        )}

        {isRetired && (
          <div className="unsafe-banner mt-20" style={{ background: 'var(--gray-light)', borderColor: 'var(--gray)', color: 'var(--text-secondary)', padding: '14px', fontSize: '0.85rem' }}>
            This asset is retired. Issue reporting and maintenance logs have been locked.
          </div>
        )}
      </div>

      {/* Safe Metadata Specifications */}
      <div className="card">
        <h3 className="mb-15" style={{ fontWeight: 700, fontSize: '0.95rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>Equipment Details</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '0.82rem' }}>
          <div>
            <span className="text-muted">Location:</span>
            <p style={{ fontWeight: 600, marginTop: '2px' }}>{asset.location}</p>
          </div>
          <div>
            <span className="text-muted">Category:</span>
            <p style={{ fontWeight: 600, marginTop: '2px' }}>{asset.category}</p>
          </div>
          <div>
            <span className="text-muted">Last Certified Service:</span>
            <p style={{ fontWeight: 600, marginTop: '2px' }}>{asset.lastServiceDate || 'Never'}</p>
          </div>
          <div>
            <span className="text-muted">Next Scheduled Service:</span>
            <p style={{ fontWeight: 600, marginTop: '2px' }}>{asset.nextServiceDate || 'Not scheduled'}</p>
          </div>
        </div>
      </div>

      {/* Safe Public Log Timeline */}
      <div className="card">
        <h3 className="mb-15" style={{ fontWeight: 700, fontSize: '0.95rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>Recent Public Logs</h3>
        
        <div className="timeline" style={{ marginTop: '10px' }}>
          {safeHistory.length === 0 ? (
            <div className="text-center text-muted" style={{ padding: '15px 0', fontSize: '0.8rem' }}>
              No service logs recorded for this equipment.
            </div>
          ) : (
            safeHistory.slice(0, 4).map((h, i) => (
              <div key={h.id} className="timeline-item" style={{ gap: '15px', paddingLeft: '20px' }}>
                <div className={`timeline-dot ${i === 0 ? 'active' : ''}`} style={{ left: '5px' }}></div>
                <div className="timeline-content" style={{ padding: '10px' }}>
                  <div className="timeline-time" style={{ fontSize: '0.7rem' }}>
                    {new Date(h.date).toLocaleDateString()} at {new Date(h.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)' }}>{h.action}</div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{h.notes}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Rescan Switcher */}
      <div style={{ textAlign: 'center' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => {
          window.location.hash = '';
          setAssetCode('');
        }}>
          Scan Another Tag
        </button>
      </div>

    </div>
  );
}
