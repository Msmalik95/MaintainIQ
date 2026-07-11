import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { 
  Search, 
  Filter, 
  User, 
  Wrench, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  AlertOctagon, 
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';

export default function IssueList({ currentRole, activeTab, setActiveTab, setSelectedAssetCode }) {
  const [issues, setIssues] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [assignedTechId, setAssignedTechId] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = () => {
    setIssues(storage.getIssues());
    setTechnicians(storage.getTechnicians());
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleStatusFilter = (e) => setStatusFilter(e.target.value);
  const handlePriorityFilter = (e) => setPriorityFilter(e.target.value);

  const filteredIssues = issues.filter(issue => {
    const asset = storage.getAssetByCode(issue.assetCode) || {};
    const matchesSearch = 
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      issue.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.name && asset.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || issue.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || issue.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const statuses = [
    'Reported', 'Assigned', 'Inspection Started', 
    'Maintenance In Progress', 'Waiting for Parts', 
    'Resolved', 'Closed', 'Reopened'
  ];
  
  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  const handleSelectIssue = (issue) => {
    setSelectedIssue(issue);
    setAssignedTechId(issue.assignedTo || '');
    setSuccessMsg('');
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (!selectedIssue) return;
    
    const actor = currentRole === 'admin' ? 'Administrator' : 'Supervisor';
    
    try {
      storage.updateIssue(selectedIssue.id, { assignedTo: assignedTechId }, actor);
      setSuccessMsg('Technician assigned successfully!');
      loadData();
      
      // Update local state issue
      const updated = storage.getIssueById(selectedIssue.id);
      setSelectedIssue(updated);
      
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReopen = () => {
    if (!selectedIssue) return;
    const actor = currentRole === 'admin' ? 'Administrator' : 'Supervisor';
    
    try {
      storage.updateIssue(selectedIssue.id, { status: 'Reopened' }, actor);
      setSuccessMsg('Ticket reopened successfully.');
      loadData();
      
      const updated = storage.getIssueById(selectedIssue.id);
      setSelectedIssue(updated);
      
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseTicket = () => {
    if (!selectedIssue) return;
    const actor = currentRole === 'admin' ? 'Administrator' : 'Supervisor';
    
    try {
      storage.updateIssue(selectedIssue.id, { status: 'Closed' }, actor);
      setSuccessMsg('Ticket closed and archived.');
      loadData();
      
      const updated = storage.getIssueById(selectedIssue.id);
      setSelectedIssue(updated);
      
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewAssetDetails = (code) => {
    setSelectedAssetCode(code);
    setActiveTab('assets');
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'Low': return 'badge-low';
      case 'Medium': return 'badge-medium';
      case 'High': return 'badge-high';
      case 'Critical': return 'badge-critical';
      default: return 'badge-medium';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Reported': return 'var(--warning)';
      case 'Assigned': return 'var(--info)';
      case 'Inspection Started': return 'var(--info)';
      case 'Maintenance In Progress': return 'var(--purple)';
      case 'Waiting for Parts': return 'var(--purple)';
      case 'Resolved': return 'var(--accent)';
      case 'Closed': return 'var(--gray)';
      case 'Reopened': return 'var(--warning)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="issues-list-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Maintenance Tickets</h1>
          <p className="page-subtitle">Inspect reported issues, review AI triage recommendations, and assign to technicians</p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card mb-20" style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Search */}
          <div style={{ flexGrow: 1, position: 'relative', minWidth: '240px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search tickets by ID, title, or asset..." 
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

          {/* Filter Priority */}
          <div>
            <select className="form-control" value={priorityFilter} onChange={handlePriorityFilter} style={{ padding: '8px 12px', width: '160px' }}>
              <option value="All">All Priorities</option>
              {priorities.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={loadData}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedIssue ? '1.2fr 1fr' : '1fr', gap: '25px', transition: 'all 0.3s ease' }}>
        
        {/* Tickets Table Card */}
        <div className="card" style={{ height: 'fit-content' }}>
          {filteredIssues.length === 0 ? (
            <div className="text-center text-muted" style={{ padding: '60px 0' }}>
              <CheckCircle2 size={48} className="mb-15" style={{ color: 'var(--accent)', strokeWidth: '1' }} />
              <h3>All clear!</h3>
              <p>No active issues matching your search filters.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Asset</th>
                    <th>Issue Title</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Date Reported</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.map(issue => {
                    const tech = technicians.find(t => t.id === issue.assignedTo);
                    const isSelected = selectedIssue && selectedIssue.id === issue.id;
                    const isCritical = issue.priority === 'Critical';

                    return (
                      <tr 
                        key={issue.id} 
                        style={{ 
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(16, 185, 129, 0.05)' : ''
                        }} 
                        onClick={() => handleSelectIssue(issue)}
                      >
                        <td style={{ fontWeight: 700 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isCritical && <AlertOctagon size={14} className="text-danger" style={{ color: 'var(--danger)' }} />}
                            {issue.id}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{issue.assetCode}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{issue.title}</div>
                          {issue.isAISuggested && (
                            <span className={issue.isAIEdited ? "ai-edited-tag" : "ai-suggested-tag"} style={{ marginTop: '3px' }}>
                              AI {issue.isAIEdited ? 'Edited' : 'Triage'}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${getPriorityBadgeClass(issue.priority)}`}>
                            {issue.priority}
                          </span>
                        </td>
                        <td>
                          <span style={{ 
                            fontWeight: 700, 
                            fontSize: '0.8rem',
                            color: getStatusColor(issue.status),
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: getStatusColor(issue.status) }}></span>
                            {issue.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {tech ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                              <User size={12} /> {tech.name}
                            </span>
                          ) : (
                            <span className="text-muted" style={{ fontStyle: 'italic' }}>Unassigned</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Issue Detail Panel */}
        {selectedIssue && (
          <div className="card" style={{ borderLeft: `4px solid ${getStatusColor(selectedIssue.status)}`, height: 'fit-content', position: 'sticky', top: '90px' }}>
            <div className="flex-between mb-15" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div>
                <span className={`badge ${getPriorityBadgeClass(selectedIssue.priority)} mb-4`}>
                  {selectedIssue.priority} Priority
                </span>
                <h3 style={{ fontWeight: 800 }}>Ticket Details</h3>
                <code style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedIssue.id}</code>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedIssue(null)}>Close</button>
            </div>

            {successMsg && (
              <div className="badge badge-operational mb-15" style={{ width: '100%', padding: '10px' }}>
                {successMsg}
              </div>
            )}

            {/* General Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '0.85rem' }} className="mb-20">
              
              <div>
                <span className="text-muted">Issue Title:</span>
                <p style={{ fontWeight: 700, fontSize: '1rem', marginTop: '2px', color: 'var(--text-primary)' }}>{selectedIssue.title}</p>
              </div>

              <div>
                <span className="text-muted">Complaint Description:</span>
                <p style={{ marginTop: '4px', padding: '10px', background: 'var(--bg-tertiary)', borderRadius: '6px', lineHeight: '1.4', color: 'var(--text-secondary)' }}>
                  {selectedIssue.description}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span className="text-muted">Asset Code:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <strong style={{ cursor: 'pointer', color: 'var(--accent)' }} onClick={() => handleViewAssetDetails(selectedIssue.assetCode)}>
                      {selectedIssue.assetCode}
                    </strong>
                    <ArrowRight size={12} />
                  </div>
                </div>
                <div>
                  <span className="text-muted">Current Ticket Status:</span>
                  <p style={{ fontWeight: 700, color: getStatusColor(selectedIssue.status), marginTop: '2px' }}>{selectedIssue.status}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span className="text-muted">Reporter Name:</span>
                  <p style={{ fontWeight: 600, marginTop: '2px' }}>{selectedIssue.reporterName || 'Anonymous'}</p>
                </div>
                <div>
                  <span className="text-muted">Reporter Contact:</span>
                  <p style={{ fontWeight: 600, marginTop: '2px' }}>{selectedIssue.reporterContact || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* AI Triaging Diagnostic Data */}
            {selectedIssue.isAISuggested && (
              <div className="ai-triage-card mb-20" style={{ margin: 0, padding: '15px', border: '1px dashed var(--accent)' }}>
                <div className="flex-between mb-10">
                  <span className="ai-suggested-tag">AI Triaged Diagnostics</span>
                  {selectedIssue.isAIEdited && <span className="ai-edited-tag">Human Edited</span>}
                </div>
                
                {/* AI Causes */}
                <div className="mb-10">
                  <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>Suggested Possible Causes:</strong>
                  <ul style={{ paddingLeft: '20px', marginTop: '4px', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {selectedIssue.possibleCauses && JSON.parse(JSON.stringify(selectedIssue.possibleCauses)).map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>

                {/* AI Checks */}
                <div>
                  <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>Safety & Diagnostic Guidelines:</strong>
                  <ul style={{ paddingLeft: '20px', marginTop: '4px', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {selectedIssue.initialChecks && JSON.parse(JSON.stringify(selectedIssue.initialChecks)).map((c, idx) => (
                      <li key={idx} style={{ 
                        color: c.startsWith('SAFETY') ? 'var(--danger)' : 'var(--text-secondary)',
                        fontWeight: c.startsWith('SAFETY') ? 'bold' : 'normal'
                      }}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Assignment Form Controls - Admin/Supervisor Role only */}
            {['admin', 'supervisor'].includes(currentRole) && (
              <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }} className="mb-20">
                <h4 style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }} className="mb-10">
                  <Wrench size={14} /> Assign Maintenance Staff
                </h4>
                
                <form onSubmit={handleAssignSubmit} style={{ display: 'flex', gap: '10px' }}>
                  <select 
                    className="form-control" 
                    value={assignedTechId} 
                    onChange={(e) => setAssignedTechId(e.target.value)}
                    style={{ flexGrow: 1, padding: '8px' }}
                    disabled={selectedIssue.status === 'Closed'}
                  >
                    <option value="">-- Choose Technician --</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.specialty})</option>
                    ))}
                  </select>
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-sm"
                    disabled={selectedIssue.status === 'Closed'}
                  >
                    Assign
                  </button>
                </form>
              </div>
            )}

            {/* Technician Actions & Resolution Log Details */}
            {['Resolved', 'Closed'].includes(selectedIssue.status) && (
              <div style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid var(--border-color)', padding: '15px', borderRadius: '12px' }} className="mb-20">
                <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }} className="mb-10">
                  <CheckCircle2 size={14} /> Resolution Summary
                </h4>
                <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <span className="text-muted">Inspection Findings:</span>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedIssue.inspectionNotes || 'None recorded'}</p>
                  </div>
                  <div>
                    <span className="text-muted">Action Performed:</span>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedIssue.workPerformed || 'None recorded'}</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span className="text-muted">Parts Replaced:</span>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedIssue.partsReplaced || 'None'}</p>
                    </div>
                    <div>
                      <span className="text-muted">Final Repair Cost:</span>
                      <p style={{ fontWeight: 700, color: 'var(--accent)' }}>${selectedIssue.maintenanceCost}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted">Resolved On:</span>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedIssue.completionDate}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Supervisor Oversight Actions (Close / Reopen) */}
            {currentRole === 'supervisor' && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                {selectedIssue.status === 'Resolved' && (
                  <button className="btn btn-primary" style={{ flexGrow: 1 }} onClick={handleCloseTicket}>
                    Approve & Close Ticket
                  </button>
                )}
                {['Resolved', 'Closed'].includes(selectedIssue.status) && (
                  <button className="btn btn-danger" style={{ flexGrow: 1 }} onClick={handleReopen}>
                    Reopen Ticket
                  </button>
                )}
              </div>
            )}
            
            {/* Admin can reopen closed issues too */}
            {currentRole === 'admin' && ['Resolved', 'Closed'].includes(selectedIssue.status) && (
              <button className="btn btn-danger" style={{ width: '100%', marginTop: '10px' }} onClick={handleReopen}>
                Reopen Ticket
              </button>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
