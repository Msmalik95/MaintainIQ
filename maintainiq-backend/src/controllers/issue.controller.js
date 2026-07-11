import Issue from "../models/Issue.js";
import Asset from "../models/Asset.js";
import HistoryLog from "../models/HistoryLog.js";

// Helper: sync asset status based on issue workflow
const syncAssetStatus = async (assetCode, issueStatus, completionDate = "") => {
  const statusMap = {
    "Inspection Started": "Under Inspection",
    "Maintenance In Progress": "Under Maintenance",
    "Waiting for Parts": "Under Maintenance",
    Resolved: "Operational",
    Reopened: "Issue Reported",
    Reported: "Issue Reported",
  };

  const newStatus = statusMap[issueStatus];
  if (!newStatus) return;

  const update = { status: newStatus };
  if (issueStatus === "Resolved" && completionDate) {
    update.lastServiceDate = completionDate;
  }

  await Asset.findOneAndUpdate({ code: assetCode }, { $set: update });
};

// Helper: log a history entry
const addHistory = async (assetCode, actor, action, notes, issueId = "") => {
  await HistoryLog.create({ assetCode, actor, action, notes, issueId, date: new Date() });
};

// GET /api/issues
export const getIssues = async (req, res) => {
  try {
    const { assetCode, status } = req.query;
    const filter = {};
    if (assetCode) filter.assetCode = assetCode.toUpperCase();
    if (status) filter.status = status;

    const issues = await Issue.find(filter)
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 });

    return res.json({ success: true, issues });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/issues/:id
export const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id).populate("assignedTo", "name email role");
    if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });
    return res.json({ success: true, issue });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/issues
export const createIssue = async (req, res) => {
  try {
    const data = req.body;
    if (!data.assetCode || !data.title) {
      return res.status(400).json({ success: false, message: "assetCode and title are required" });
    }

    // Verify asset exists
    const asset = await Asset.findOne({ code: data.assetCode.toUpperCase() });
    if (!asset) {
      return res.status(404).json({ success: false, message: `Asset "${data.assetCode}" not found` });
    }

    const issue = await Issue.create({
      ...data,
      assetCode: data.assetCode.toUpperCase(),
      status: "Reported",
    });

    // Update asset status
    await Asset.findOneAndUpdate({ code: issue.assetCode }, { status: "Issue Reported" });

    const aiNote = issue.isAISuggested ? " [AI Suggested]" : "";
    await addHistory(
      issue.assetCode,
      data.reporterName || "Reporter (Public User)",
      "Issue Reported",
      `Reported issue ${issue._id}: "${issue.title}" (Priority: ${issue.priority})${aiNote}`,
      issue._id.toString(),
    );

    return res.status(201).json({ success: true, issue });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/issues/:id
export const updateIssue = async (req, res) => {
  try {
    const oldIssue = await Issue.findById(req.params.id);
    if (!oldIssue) return res.status(404).json({ success: false, message: "Issue not found" });

    const actorName = req.user ? `${req.user.name} (${req.user.role})` : "System";
    const updates = req.body;

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true },
    ).populate("assignedTo", "name email role");

    // Log status changes
    if (updates.status && updates.status !== oldIssue.status) {
      await addHistory(
        issue.assetCode,
        actorName,
        "Issue Status Changed",
        `Issue status changed from ${oldIssue.status} to ${issue.status}`,
        issue._id.toString(),
      );
      await syncAssetStatus(issue.assetCode, issue.status, issue.completionDate);
    }

    // Log technician assignment
    if (updates.assignedTo && String(updates.assignedTo) !== String(oldIssue.assignedTo)) {
      const techName = issue.assignedTo ? issue.assignedTo.name : "None";
      await addHistory(
        issue.assetCode,
        actorName,
        "Technician Assigned",
        `Issue ${issue._id} assigned to ${techName}`,
        issue._id.toString(),
      );

      // Auto-advance status to Assigned when a technician is set
      if (oldIssue.status === "Reported" && updates.assignedTo) {
        await Issue.findByIdAndUpdate(issue._id, { status: "Assigned" });
        await addHistory(
          issue.assetCode,
          actorName,
          "Issue Status Changed",
          `Issue status automatically advanced to Assigned`,
          issue._id.toString(),
        );
      }
    }

    return res.json({ success: true, issue });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
