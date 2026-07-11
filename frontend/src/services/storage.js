// LocalStorage database management for MaintainIQ

const SEED_TECHNICIANS = [
  { id: "TECH-01", name: "Alice Miller", specialty: "AV & IT Hardware", email: "alice@maintainiq.com" },
  { id: "TECH-02", name: "Bob Chen", specialty: "HVAC & Plumbing", email: "bob@maintainiq.com" },
  { id: "TECH-03", name: "Charlie Davis", specialty: "General Facility & Mechanical", email: "charlie@maintainiq.com" }
];

const SEED_USERS = [
  { id: "USR-01", name: "Administrator", email: "admin@maintainiq.com", password: "admin123", role: "admin" },
  { id: "USR-02", name: "Alice Miller", email: "alice@maintainiq.com", password: "tech123", role: "technician" },
  { id: "USR-03", name: "Supervisor", email: "supervisor@maintainiq.com", password: "super123", role: "supervisor" }
];


const SEED_ASSETS = [
  {
    id: "AST-001",
    name: "Classroom Projector 01",
    code: "CR-PROJ-01",
    category: "AV Equipment",
    location: "Classroom 101",
    condition: "Fair",
    status: "Operational",
    lastServiceDate: "2026-05-10",
    nextServiceDate: "2026-08-10",
    serialNumber: "SN-PROJ-991A",
    purchaseCost: 850,
    notes: "HDMI port is slightly loose. Keep lens cap in drawer.",
    technicianId: "TECH-01"
  },
  {
    id: "AST-002",
    name: "Lobby Air Conditioner",
    code: "LOBBY-AC-02",
    category: "HVAC",
    location: "Main Lobby",
    condition: "Good",
    status: "Operational",
    lastServiceDate: "2026-06-01",
    nextServiceDate: "2026-09-01",
    serialNumber: "SN-AC-1029B",
    purchaseCost: 2400,
    notes: "Uses R-410A refrigerant. Filter replaced last month.",
    technicianId: "TECH-02"
  },
  {
    id: "AST-003",
    name: "Library Laser Printer",
    code: "LIB-PRINT-03",
    category: "IT Hardware",
    location: "Library Reference Area",
    condition: "Fair",
    status: "Operational",
    lastServiceDate: "2026-04-15",
    nextServiceDate: "2026-07-15",
    serialNumber: "SN-LPT-442C",
    purchaseCost: 450,
    notes: "Fuser assembly is near end-of-life.",
    technicianId: "TECH-01"
  },
  {
    id: "AST-004",
    name: "Lab Microscope 04",
    code: "LAB-MIC-04",
    category: "Lab Equipment",
    location: "Microbiology Lab",
    condition: "Good",
    status: "Operational",
    lastServiceDate: "2026-03-20",
    nextServiceDate: "2026-09-20",
    serialNumber: "SN-MIC-883D",
    purchaseCost: 1800,
    notes: "Calibrated for 100x oil immersion lens.",
    technicianId: "TECH-03"
  },
  {
    id: "AST-005",
    name: "Service Elevator",
    code: "ELEVATOR-01",
    category: "Facility",
    location: "West Wing Elevator Shaft",
    condition: "Good",
    status: "Operational",
    lastServiceDate: "2026-06-15",
    nextServiceDate: "2026-07-15",
    serialNumber: "SN-OTIS-777",
    purchaseCost: 45000,
    notes: "Annual safety certificate expires Dec 2026.",
    technicianId: "TECH-02"
  }
];

const SEED_ISSUES = [
  {
    id: "ISS-1001",
    assetCode: "LIB-PRINT-03",
    title: "Fuser overheating warning",
    description: "Printer reports Error 50.1 Fuser Overheat and refuses to print after 20 sheets.",
    priority: "High",
    category: "IT Hardware",
    reporterName: "John Doe",
    reporterContact: "john@example.com",
    status: "Resolved",
    assignedTo: "TECH-01",
    evidenceImage: "",
    inspectionNotes: "Fuser was clogged with dust and paper residue. Thermal sensors checked.",
    workPerformed: "Cleaned fuser assembly, adjusted speed alignment, and verified clean printing.",
    partsReplaced: "Fuser rollers cleaned (no new parts)",
    maintenanceCost: 50,
    completionDate: "2026-04-15",
    createdAt: "2026-04-15T09:00:00.000Z",
    isAISuggested: false,
    isAIEdited: false
  },
  {
    id: "ISS-1002",
    assetCode: "CR-PROJ-01",
    title: "Display Flickering / HDMI Issue",
    description: "The projector display flickers violently and sometimes cuts out to a 'No Input Found' screen when using HDMI.",
    priority: "Medium",
    category: "AV Equipment",
    reporterName: "Prof. Sarah Smith",
    reporterContact: "s.smith@school.edu",
    status: "Assigned",
    assignedTo: "TECH-01",
    evidenceImage: "",
    inspectionNotes: "",
    workPerformed: "",
    partsReplaced: "",
    maintenanceCost: 0,
    completionDate: "",
    createdAt: "2026-07-11T12:00:00.000Z",
    isAISuggested: true,
    isAIEdited: false
  }
];

const SEED_HISTORY = [
  {
    id: "LOG-001",
    assetCode: "LIB-PRINT-03",
    issueId: "ISS-1001",
    date: "2026-04-15T09:00:00.000Z",
    actor: "Reporter (Public User)",
    action: "Issue Reported",
    notes: "Reported: 'Fuser overheating warning' (Priority: High)"
  },
  {
    id: "LOG-002",
    assetCode: "LIB-PRINT-03",
    issueId: "ISS-1001",
    date: "2026-04-15T10:00:00.000Z",
    actor: "Administrator",
    action: "Assigned Technician",
    notes: "Assigned to Alice Miller"
  },
  {
    id: "LOG-003",
    assetCode: "LIB-PRINT-03",
    issueId: "ISS-1001",
    date: "2026-04-15T14:30:00.000Z",
    actor: "Alice Miller (Technician)",
    action: "Maintenance Resolved",
    notes: "Resolved: Cleaned fuser assembly. Parts: None. Cost: $50.00."
  },
  {
    id: "LOG-004",
    assetCode: "CR-PROJ-01",
    issueId: "ISS-1002",
    date: "2026-07-11T12:00:00.000Z",
    actor: "Reporter (Public User)",
    action: "Issue Reported",
    notes: "Reported: 'Display Flickering / HDMI Issue' (Priority: Medium) [AI Suggested]"
  },
  {
    id: "LOG-005",
    assetCode: "CR-PROJ-01",
    issueId: "ISS-1002",
    date: "2026-07-11T12:05:00.000Z",
    actor: "Administrator",
    action: "Assigned Technician",
    notes: "Assigned to Alice Miller"
  }
];

const SEED_SETTINGS = {
  geminiApiKey: "",
  networkLagSim: 0,
  organizationName: "MaintainIQ Central Facilities"
};

// Helper function to read from local storage with seeding fallback
function getStoredData(key, fallback) {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error(`Error parsing localStorage key ${key}`, e);
    return fallback;
  }
}

function setStoredData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
export const storage = {
  // Reset
  resetDatabase() {
    localStorage.removeItem("maintainiq_assets");
    localStorage.removeItem("maintainiq_issues");
    localStorage.removeItem("maintainiq_history");
    localStorage.removeItem("maintainiq_settings");
    localStorage.removeItem("maintainiq_technicians");
    localStorage.removeItem("maintainiq_users");
    localStorage.removeItem("maintainiq_current_user");
    
    // Seed fresh
    setStoredData("maintainiq_assets", SEED_ASSETS);
    setStoredData("maintainiq_issues", SEED_ISSUES);
    setStoredData("maintainiq_history", SEED_HISTORY);
    setStoredData("maintainiq_settings", SEED_SETTINGS);
    setStoredData("maintainiq_technicians", SEED_TECHNICIANS);
    setStoredData("maintainiq_users", SEED_USERS);
  },
  // Technicians
  getTechnicians() {
    return getStoredData("maintainiq_technicians", SEED_TECHNICIANS);
  },

  // Assets
  getAssets() {
    return getStoredData("maintainiq_assets", SEED_ASSETS);
  },
  saveAssets(assets) {
    setStoredData("maintainiq_assets", assets);
  },
  getAssetByCode(code) {
    const assets = this.getAssets();
    return assets.find(a => a.code.toUpperCase() === code.toUpperCase());
  },
  addAsset(asset) {
    const assets = this.getAssets();
    const cleanCode = asset.code.trim().toUpperCase();
    if (assets.some(a => a.code.toUpperCase() === cleanCode)) {
      throw new Error(`Asset code "${asset.code}" already exists.`);
    }
    const newAsset = {
      ...asset,
      id: `AST-${Date.now().toString().slice(-4)}`,
      code: cleanCode,
      status: "Operational" // Start operational
    };
    assets.push(newAsset);
    this.saveAssets(assets);
    
    this.addHistoryEntry(newAsset.code, "Administrator", "Asset Registered", `Registered new asset "${newAsset.name}" at location "${newAsset.location}"`);
    return newAsset;
  },
  updateAsset(code, data) {
    const assets = this.getAssets();
    const index = assets.findIndex(a => a.code.toUpperCase() === code.toUpperCase());
    if (index === -1) throw new Error(`Asset "${code}" not found.`);
    
    const oldAsset = assets[index];
    const newAsset = { ...oldAsset, ...data };
    assets[index] = newAsset;
    this.saveAssets(assets);
    
    // Log modifications if status or condition changed
    if (oldAsset.status !== newAsset.status) {
      this.addHistoryEntry(newAsset.code, "System", "Asset Status Updated", `Status updated from ${oldAsset.status} to ${newAsset.status}`);
    }
    return newAsset;
  },

  // Issues
  getIssues() {
    return getStoredData("maintainiq_issues", SEED_ISSUES);
  },
  saveIssues(issues) {
    setStoredData("maintainiq_issues", issues);
  },
  getIssueById(id) {
    const issues = this.getIssues();
    return issues.find(i => i.id === id);
  },
  addIssue(issue) {
    const issues = this.getIssues();
    const newIssue = {
      ...issue,
      id: `ISS-${Date.now().toString().slice(-4)}`,
      status: "Reported",
      assignedTo: "",
      evidenceImage: issue.evidenceImage || "",
      inspectionNotes: "",
      workPerformed: "",
      partsReplaced: "",
      maintenanceCost: 0,
      completionDate: "",
      createdAt: new Date().toISOString()
    };
    issues.push(newIssue);
    this.saveIssues(issues);
    
    // Automatically update the asset status to "Issue Reported"
    this.updateAsset(newIssue.assetCode, { status: "Issue Reported" });
    
    this.addHistoryEntry(
      newIssue.assetCode,
      "Reporter (Public User)",
      "Issue Reported",
      `Reported issue ${newIssue.id}: "${newIssue.title}" (Priority: ${newIssue.priority})`,
      newIssue.id
    );
    
    return newIssue;
  },
  updateIssue(id, data, actorName = "System") {
    const issues = this.getIssues();
    const index = issues.findIndex(i => i.id === id);
    if (index === -1) throw new Error(`Issue "${id}" not found.`);
    
    const oldIssue = issues[index];
    const newIssue = { ...oldIssue, ...data };
    issues[index] = newIssue;
    this.saveIssues(issues);
    
    // Log changes to history
    if (oldIssue.status !== newIssue.status) {
      this.addHistoryEntry(
        newIssue.assetCode,
        actorName,
        "Issue Status Changed",
        `Issue ${id} status changed from ${oldIssue.status} to ${newIssue.status}`,
        id
      );
      
      // Sync asset status based on issue workflow
      let assetStatus = null;
      if (newIssue.status === "Assigned") {
        // Keeps Asset Status as Issue Reported, but is now assigned
      } else if (newIssue.status === "Inspection Started") {
        assetStatus = "Under Inspection";
      } else if (newIssue.status === "Maintenance In Progress") {
        assetStatus = "Under Maintenance";
      } else if (newIssue.status === "Waiting for Parts") {
        assetStatus = "Under Maintenance"; // Remains under maintenance
      } else if (newIssue.status === "Resolved") {
        assetStatus = "Operational"; // Return to operational
        // Also update last service date on asset
        this.updateAsset(newIssue.assetCode, { 
          status: "Operational", 
          lastServiceDate: newIssue.completionDate || new Date().toISOString().split('T')[0]
        });
      } else if (newIssue.status === "Reopened") {
        assetStatus = "Issue Reported";
      }
      
      if (assetStatus) {
        this.updateAsset(newIssue.assetCode, { status: assetStatus });
      }
    }
    
    if (oldIssue.assignedTo !== newIssue.assignedTo) {
      const tech = this.getTechnicians().find(t => t.id === newIssue.assignedTo);
      const name = tech ? tech.name : "None";
      this.addHistoryEntry(
        newIssue.assetCode,
        actorName,
        "Technician Assigned",
        `Issue ${id} assigned to ${name}`,
        id
      );
      
      if (oldIssue.status === "Reported" && newIssue.assignedTo) {
        // Automatically progress issue status to Assigned
        this.updateIssue(id, { status: "Assigned" }, actorName);
      }
    }
    
    return newIssue;
  },

  // History entries
  getHistory() {
    return getStoredData("maintainiq_history", SEED_HISTORY);
  },
  addHistoryEntry(assetCode, actor, action, notes, issueId = "") {
    const history = this.getHistory();
    const entry = {
      id: `LOG-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`,
      assetCode: assetCode.toUpperCase(),
      issueId,
      date: new Date().toISOString(),
      actor,
      action,
      notes
    };
    history.unshift(entry); // Newest first
    setStoredData("maintainiq_history", history);
    return entry;
  },
  getHistoryForAsset(assetCode) {
    const history = this.getHistory();
    return history.filter(h => h.assetCode.toUpperCase() === assetCode.toUpperCase());
  },

  // Settings
  getSettings() {
    return getStoredData("maintainiq_settings", SEED_SETTINGS);
  },
  saveSettings(settings) {
    setStoredData("maintainiq_settings", settings);
  },

  // Users & Auth
  getUsers() {
    return getStoredData("maintainiq_users", SEED_USERS);
  },
  registerUser(name, email, password, role) {
    const users = this.getUsers();
    const normalizedEmail = email.trim().toLowerCase();
    if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      throw new Error(`A user with email ${email} already exists.`);
    }
    const newUser = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      email: normalizedEmail,
      password,
      role
    };
    users.push(newUser);
    setStoredData("maintainiq_users", users);
    
    if (role === 'technician') {
      const technicians = this.getTechnicians();
      if (!technicians.some(t => t.email.toLowerCase() === normalizedEmail)) {
        technicians.push({
          id: `TECH-${newUser.id.split('-')[1]}`,
          name: newUser.name,
          specialty: "General Facility & Maintenance",
          email: newUser.email
        });
        setStoredData("maintainiq_technicians", technicians);
      }
    }
    
    return newUser;
  },
  loginUser(email, password) {
    const users = this.getUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === normalizedEmail && u.password === password);
    if (!user) {
      throw new Error("Invalid email or password.");
    }
    setStoredData("maintainiq_current_user", user);
    return user;
  },
  resetUserPassword(email, newPassword) {
    const users = this.getUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === normalizedEmail);
    if (userIndex === -1) {
      throw new Error("No user found with that email address.");
    }
    users[userIndex].password = newPassword;
    setStoredData("maintainiq_users", users);
    return true;
  },
  getCurrentUser() {
    const user = localStorage.getItem("maintainiq_current_user");
    if (!user) return null;
    try {
      return JSON.parse(user);
    } catch {
      return null;
    }
  },
  logoutUser() {
    localStorage.removeItem("maintainiq_current_user");
  }
};
