import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";

// Models for Seeding
import User from "../models/User.js";
import Asset from "../models/Asset.js";
import Issue from "../models/Issue.js";
import HistoryLog from "../models/HistoryLog.js";
import Settings from "../models/Settings.js";

dotenv.config();

dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const seedDatabase = async () => {
  try {
    // 1. Seed Users
    const userCount = await User.countDocuments();
    let seededUsersMap = {};
    if (userCount === 0) {
      console.log("🌱 Seeding default users...");
      const usersToSeed = [
        { name: "Administrator", email: "admin@maintainiq.com", password: "admin123", role: "admin" },
        { name: "Alice Miller", email: "alice@maintainiq.com", password: "tech123", role: "technician" },
        { name: "Supervisor", email: "supervisor@maintainiq.com", password: "super123", role: "supervisor" }
      ];
      for (const u of usersToSeed) {
        const created = await User.create(u);
        seededUsersMap[created.role] = created._id;
      }
      console.log("✓ Seeded default users");
    } else {
      const users = await User.find();
      users.forEach(u => {
        seededUsersMap[u.role] = u._id;
      });
    }

    // 2. Seed Assets
    const assetCount = await Asset.countDocuments();
    if (assetCount === 0) {
      console.log("🌱 Seeding default assets...");
      const assetsToSeed = [
        {
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
          technicianId: seededUsersMap["technician"] || null
        },
        {
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
          technicianId: seededUsersMap["technician"] || null
        },
        {
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
          technicianId: seededUsersMap["technician"] || null
        },
        {
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
          technicianId: seededUsersMap["technician"] || null
        },
        {
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
          technicianId: seededUsersMap["technician"] || null
        }
      ];
      await Asset.create(assetsToSeed);
      console.log("✓ Seeded default assets");
    }

    // 3. Seed Issues
    const issueCount = await Issue.countDocuments();
    if (issueCount === 0) {
      console.log("🌱 Seeding default issues...");
      const issuesToSeed = [
        {
          assetCode: "LIB-PRINT-03",
          title: "Fuser overheating warning",
          description: "Printer reports Error 50.1 Fuser Overheat and refuses to print after 20 sheets.",
          priority: "High",
          category: "IT Hardware",
          reporterName: "John Doe",
          reporterContact: "john@example.com",
          status: "Resolved",
          assignedTo: seededUsersMap["technician"] || null,
          evidenceImage: "",
          inspectionNotes: "Fuser was clogged with dust and paper residue. Thermal sensors checked.",
          workPerformed: "Cleaned fuser assembly, adjusted speed alignment, and verified clean printing.",
          partsReplaced: "Fuser rollers cleaned (no new parts)",
          maintenanceCost: 50,
          completionDate: "2026-04-15",
          isAISuggested: false,
          isAIEdited: false
        },
        {
          assetCode: "CR-PROJ-01",
          title: "Display Flickering / HDMI Issue",
          description: "The projector display flickers violently and sometimes cuts out to a 'No Input Found' screen when using HDMI.",
          priority: "Medium",
          category: "AV Equipment",
          reporterName: "Prof. Sarah Smith",
          reporterContact: "s.smith@school.edu",
          status: "Assigned",
          assignedTo: seededUsersMap["technician"] || null,
          evidenceImage: "",
          inspectionNotes: "",
          workPerformed: "",
          partsReplaced: "",
          maintenanceCost: 0,
          completionDate: "",
          isAISuggested: true,
          isAIEdited: false
        }
      ];
      await Issue.create(issuesToSeed);
      console.log("✓ Seeded default issues");
    }

    // 4. Seed History Logs
    const historyCount = await HistoryLog.countDocuments();
    if (historyCount === 0) {
      console.log("🌱 Seeding default history logs...");
      const historyToSeed = [
        {
          assetCode: "LIB-PRINT-03",
          issueId: "",
          actor: "Reporter (Public User)",
          action: "Issue Reported",
          notes: "Reported: 'Fuser overheating warning' (Priority: High)",
          date: new Date("2026-04-15T09:00:00.000Z")
        },
        {
          assetCode: "LIB-PRINT-03",
          issueId: "",
          actor: "Administrator",
          action: "Assigned Technician",
          notes: "Assigned to Alice Miller",
          date: new Date("2026-04-15T10:00:00.000Z")
        },
        {
          assetCode: "LIB-PRINT-03",
          issueId: "",
          actor: "Alice Miller (Technician)",
          action: "Maintenance Resolved",
          notes: "Resolved: Cleaned fuser assembly. Parts: None. Cost: $50.00.",
          date: new Date("2026-04-15T14:30:00.000Z")
        },
        {
          assetCode: "CR-PROJ-01",
          issueId: "",
          actor: "Reporter (Public User)",
          action: "Issue Reported",
          notes: "Reported: 'Display Flickering / HDMI Issue' (Priority: Medium) [AI Suggested]",
          date: new Date("2026-07-11T12:00:00.000Z")
        },
        {
          assetCode: "CR-PROJ-01",
          issueId: "",
          actor: "Administrator",
          action: "Assigned Technician",
          notes: "Assigned to Alice Miller",
          date: new Date("2026-07-11T12:05:00.000Z")
        }
      ];
      await HistoryLog.create(historyToSeed);
      console.log("✓ Seeded default history logs");
    }

    // 5. Seed Settings
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      console.log("🌱 Seeding default settings...");
      await Settings.create({
        organizationName: "MaintainIQ Central Facilities",
        geminiApiKey: "",
        networkLagSim: 0
      });
      console.log("✓ Seeded default settings");
    }

  } catch (err) {
    console.error("✗ Error seeding database:", err);
  }
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✓ MongoDB connected");
    
    // Run Seeding check
    await seedDatabase();
  } catch (err) {
    console.log("✗ MongoDB connection error:", err);
    throw err;
  }
};

export default connectDB;
