import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { 
  Wrench, 
  Eye, 
  User, 
  Calendar, 
  Clock, 
  AlertTriangle,
  ClipboardList, 
  CheckCircle,
  FileCheck2,
  DollarSign
} from 'lucide-react';

export default function TechnicianPortal() {
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [myIssues, setMyIssues] = useState([]);
  const [activeIssue, setActiveIssue] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Stepper state
  const [currentStep, setCurrentStep] = useState(1); // 1: Assigned, 2: Inspected, 3: Under Maintenance, 4: Complete/Resolve Form

  // Resolution Form data
  const [resolutionData, setResolutionData] = useState({
    inspectionNotes: '',
    workPerformed: '',
    partsReplaced: '',
    maintenanceCost: 0,
    nextServiceDate: '',
    evidenceImage: ''
  });

  useEffect(() => {
    const techs = storage.getTechnicians();
    setTechnicians(techs);
    if (techs.length > 0) {
      setSelectedTechId(techs[0].id); // Default to first technician
    }
  }, []);

  useEffect(() => {
    loadMyIssues();
  }, [selectedTechId]);

  const loadMyIssues = () => {
    if (!selectedTechId) return;
    const issues = storage.getIssues();
    // Get issues assigned to me, excluding Closed ones
    const filtered = issues.filter(i => i.assignedTo === selectedTechId && i.status !== 'Closed');
    setMyIssues(filtered);
    
    // Auto-update active issue if it is still in the list, or clear
    if (activeIssue) {
      const updatedActive = filtered.find(i => i.id === activeIssue.id);
      if (updatedActive) {
        setActiveIssue(updatedActive);
      } else {
        setActiveIssue(null);
      }
    }
  };

  const handleSelectIssue = (issue) => {
    setActiveIssue(issue);
    setErrorMsg('');
    setSuccessMsg('');
    
    // Map status to step index
    if (issue.status === 'Assigned') {
      setCurrentStep(1);
    } else if (issue.status === 'Inspection Started') {
      setCurrentStep(2);
    } else if (issue.status === 'Maintenance In Progress' || issue.status === 'Waiting for Parts') {
      setCurrentStep(3);
    } else if (issue.status === 'Resolved') {
      setCurrentStep(4);
    }

    // Load initial resolution details if already exists
    setResolutionData({
      inspectionNotes: issue.inspectionNotes || '',
      workPerformed: issue.workPerformed || '',
      partsReplaced: issue.partsReplaced || '',
      maintenanceCost: issue.maintenanceCost || 0,
      nextServiceDate: '', // Set on resolve
      evidenceImage: issue.evidenceImage || ''
    });
  };

  const getActiveTechName = () => {
    const tech = technicians.find(t => t.id === selectedTechId);
    return tech ? tech.name : '';
  };

  // Workflow transitions
  const startInspection = () => {
    if (!activeIssue) return;
    const techName = getActiveTechName();
    storage.updateIssue(activeIssue.id, { status: 'Inspection Started' }, `${techName} (Technician)`);
    setCurrentStep(2);
    loadMyIssues();
    setSuccessMsg('Inspection stage started. Asset updated to Under Inspection.');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const startMaintenance = () => {
    if (!activeIssue) return;
    const techName = getActiveTechName();
    storage.updateIssue(activeIssue.id, { status: 'Maintenance In Progress' }, `${techName} (Technician)`);
    setCurrentStep(3);
    loadMyIssues();
    setSuccessMsg('Maintenance stage started. Asset updated to Under Maintenance.');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const setWaitingForParts = () => {
    if (!activeIssue) return;
    const techName = getActiveTechName();
    storage.updateIssue(activeIssue.id, { status: 'Waiting for Parts' }, `${techName} (Technician)`);
    loadMyIssues();
    setSuccessMsg('Status updated: Waiting for Parts.');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setResolutionData(prev => ({
      ...prev,
      [name]: name === 'maintenanceCost' ? Math.max(0, Number(value)) : value
    }));
  };

  // Mock File upload to base64 for evidence upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setResolutionData(prev => ({
          ...prev,
          evidenceImage: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResolveSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Business Validations
    if (!resolutionData.inspectionNotes.trim()) {
      setErrorMsg('Inspection findings cannot be empty.');
      return;
    }
    if (!resolutionData.workPerformed.trim()) {
      setErrorMsg('Work performed details must be recorded.');
      return;
    }
    if (resolutionData.maintenanceCost < 0) {
      setErrorMsg('Maintenance cost cannot be negative.');
      return;
    }
    if (!resolutionData.nextServiceDate) {
      setErrorMsg('Please schedule the next preventive service date.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (resolutionData.nextServiceDate < todayStr) {
      setErrorMsg('Next service date cannot be scheduled in the past.');
      return;
    }

    const techName = getActiveTechName();
    const completionDate = todayStr;

    try {
      // 1. Update the Issue
      storage.updateIssue(activeIssue.id, {
        status: 'Resolved',
        inspectionNotes: resolutionData.inspectionNotes,
        workPerformed: resolutionData.workPerformed,
        partsReplaced: resolutionData.partsReplaced || 'None',
        maintenanceCost: resolutionData.maintenanceCost,
        evidenceImage: resolutionData.evidenceImage,
        completionDate: completionDate
      }, `${techName} (Technician)`);

      // 2. Update the Asset Next Service Date and Condition
      const asset = storage.getAssetByCode(activeIssue.assetCode);
      storage.updateAsset(activeIssue.assetCode, {
        nextServiceDate: resolutionData.nextServiceDate,
        condition: 'Good' // Reset to good after repair
      });

      setSuccessMsg('Work order resolved! Asset restored to Operational.');
      loadMyIssues();
      setCurrentStep(4);
      setTimeout(() => {
        setSuccessMsg('');
        setActiveIssue(null);
      }, 2000);

    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="technician-portal-page">
      {/* Simulation Selector Bar */}
      <div className="card mb-20" style={{ padding: '16px 24px', borderLeft: '4px solid var(--purple)' }}>
        <div className="flex-between flex-wrap gap-10">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'var(--purple-light)', color: 'var(--purple)', padding: '10px', borderRadius: '50%' }}>
              <User size={20} />
            </div>
            <div>
              <h3 style={{ fontWeight: 700 }}>Simulate Active Technician</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Choose which technician profile to inspect assigned tickets</p>
            </div>
          </div>
          <div>
            <select 
              className="form-control" 
              value={selectedTechId} 
              onChange={(e) => {
                setSelectedTechId(e.target.value);
                setActiveIssue(null);
              }}
              style={{ width: '220px', padding: '10px' }}
            >
              {technicians.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.specialty})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Assigned Work Queue</h1>
          <p className="page-subtitle">Perform inspections, log replacement parts, and complete repair workflows</p>
        </div>
      </div>

      {/* Main Layout Split */}
      <div style={{ display: 'grid', gridTemplateColumns: activeIssue ? '1.2fr 1fr' : '1fr', gap: '25px' }}>
        
        {/* Work Orders List */}
        <div className="card">
          <h3 className="mb-15" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={20} /> Tasks Assigned to Me ({myIssues.length})
          </h3>

          {myIssues.length === 0 ? (
            <div className="text-center text-muted" style={{ padding: '40px 0' }}>
              <CheckCircle size={48} className="mb-15" style={{ color: 'var(--accent)', strokeWidth: '1.2' }} />
              <h3>All caught up!</h3>
              <p>No active maintenance tickets are assigned to you.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Asset</th>
                    <th>Issue Summary</th>
                    <th>Priority</th>
                    <th>Workflow Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {myIssues.map(issue => {
                    const isSelected = activeIssue && activeIssue.id === issue.id;
                    let statColor = 'var(--text-muted)';
                    if (issue.status === 'Assigned') statColor = 'var(--purple)';
                    if (issue.status === 'Inspection Started') statColor = 'var(--info)';
                    if (issue.status === 'Maintenance In Progress') statColor = 'var(--purple)';
                    if (issue.status === 'Waiting for Parts') statColor = 'var(--warning)';
                    if (issue.status === 'Resolved') statColor = 'var(--accent)';

                    return (
                      <tr 
                        key={issue.id} 
                        style={{ cursor: 'pointer', background: isSelected ? 'rgba(139, 92, 246, 0.05)' : '' }}
                        onClick={() => handleSelectIssue(issue)}
                      >
                        <td style={{ fontWeight: 700 }}>{issue.id}</td>
                        <td style={{ fontWeight: 600 }}>{issue.assetCode}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{issue.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {issue.description}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${issue.priority === 'Critical' ? 'badge-critical' : issue.priority === 'High' ? 'badge-high' : issue.priority === 'Medium' ? 'badge-medium' : 'badge-low'}`}>
                            {issue.priority}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: statColor, fontSize: '0.8rem' }}>{issue.status}</strong>
                        </td>
                        <td className="text-right">
                          <button className="btn btn-secondary btn-sm" onClick={() => handleSelectIssue(issue)}>
                            <Eye size={12} /> Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Task Inspection/Workflow Console */}
        {activeIssue && (
          <div className="card" style={{ height: 'fit-content', borderLeft: '4px solid var(--purple)', position: 'sticky', top: '90px' }}>
            
            {/* Header */}
            <div className="flex-between mb-20" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div>
                <span className="badge badge-under-inspection mb-4">{activeIssue.status}</span>
                <h3 style={{ fontWeight: 800 }}>Resolution Console</h3>
                <code style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ticket: {activeIssue.id}</code>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveIssue(null)}>Close</button>
            </div>

            {successMsg && <div className="badge badge-operational mb-15" style={{ width: '100%', padding: '10px' }}>{successMsg}</div>}
            {errorMsg && <div className="unsafe-banner mb-15" style={{ padding: '10px' }}><div className="banner-left"><span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{errorMsg}</span></div></div>}

            {/* Stepper Display */}
            <div className="stepper">
              <div className={`step-node ${currentStep >= 1 ? 'completed' : ''} ${currentStep === 1 ? 'active' : ''}`}>
                1
                <span className="step-label">Assigned</span>
              </div>
              <div className={`step-node ${currentStep >= 2 ? 'completed' : ''} ${currentStep === 2 ? 'active' : ''}`}>
                2
                <span className="step-label">Inspect</span>
              </div>
              <div className={`step-node ${currentStep >= 3 ? 'completed' : ''} ${currentStep === 3 ? 'active' : ''}`}>
                3
                <span className="step-label">Repair</span>
              </div>
              <div className={`step-node ${currentStep >= 4 ? 'completed' : ''} ${currentStep === 4 ? 'active' : ''}`}>
                4
                <span className="step-label">Resolve</span>
              </div>
            </div>

            <div style={{ marginTop: '30px' }}>
              {/* Asset Reference */}
              <div className="mb-15" style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                <div style={{ color: 'var(--text-muted)' }}>Target Asset:</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{activeIssue.assetCode}</div>
                <div style={{ marginTop: '5px', fontSize: '0.78rem' }}>
                  <strong>Title: </strong> {activeIssue.title}
                </div>
                <div style={{ marginTop: '3px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <strong>Details: </strong> {activeIssue.description}
                </div>
              </div>

              {/* Step 1 Console: Start Inspection */}
              {currentStep === 1 && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p className="text-secondary mb-15" style={{ fontSize: '0.85rem' }}>
                    You must flag this ticket to let the organization know you are beginning physical inspection.
                  </p>
                  <button className="btn btn-primary" onClick={startInspection} style={{ width: '100%' }}>
                    Start Inspection
                  </button>
                </div>
              )}

              {/* Step 2 Console: Start Repairs */}
              {currentStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
                    Inspection is underway. Once diagnostic checks are done, flag the ticket as Under Maintenance to begin fixing.
                  </p>
                  <button className="btn btn-primary" onClick={startMaintenance}>
                    Begin Maintenance & Repair Work
                  </button>
                  <button className="btn btn-secondary" onClick={setWaitingForParts}>
                    Mark as: Waiting for Parts
                  </button>
                </div>
              )}

              {/* Step 3 Console: Resolution Form */}
              {currentStep === 3 && (
                <form onSubmit={handleResolveSubmit}>
                  <div className="form-group">
                    <label className="form-label">Inspection Findings *</label>
                    <textarea 
                      name="inspectionNotes" 
                      className="form-control" 
                      rows="2" 
                      required
                      placeholder="What was discovered during diagnostics? (e.g. HDMI cable split internally)"
                      value={resolutionData.inspectionNotes}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Work Performed (Notes) *</label>
                    <textarea 
                      name="workPerformed" 
                      className="form-control" 
                      rows="2" 
                      required
                      placeholder="What actions were taken? (e.g. Replaced cable, secured HDMI port socket)"
                      value={resolutionData.workPerformed}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Parts Replaced</label>
                      <input 
                        type="text" 
                        name="partsReplaced" 
                        className="form-control" 
                        placeholder="e.g. 1x Gold HDMI Cable"
                        value={resolutionData.partsReplaced}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Repair Cost ($) *</label>
                      <input 
                        type="number" 
                        name="maintenanceCost" 
                        className="form-control" 
                        min="0"
                        required
                        value={resolutionData.maintenanceCost}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Schedule Next Service Date *</label>
                    <input 
                      type="date" 
                      name="nextServiceDate" 
                      className="form-control" 
                      required
                      value={resolutionData.nextServiceDate}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Evidence Upload */}
                  <div className="form-group">
                    <label className="form-label">Evidence Image Upload</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="form-control" 
                      style={{ padding: '8px 12px' }}
                      onChange={handleImageUpload}
                    />
                    {resolutionData.evidenceImage && (
                      <div className="mt-10" style={{ textAlign: 'center' }}>
                        <img 
                          src={resolutionData.evidenceImage} 
                          alt="Evidence preview" 
                          style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '8px', border: '1px solid var(--border-color)' }} 
                        />
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                    Submit Resolution & Restore Asset
                  </button>
                </form>
              )}

              {/* Step 4 Console: Completed */}
              {currentStep === 4 && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <FileCheck2 size={48} className="text-accent mb-10" style={{ color: 'var(--accent)', margin: '0 auto' }} />
                  <h4 style={{ fontWeight: 700 }}>Ticket Resolved</h4>
                  <p className="text-muted mt-4" style={{ fontSize: '0.8rem' }}>
                    Asset operational state synchronized. Good job!
                  </p>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
