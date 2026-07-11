# MaintainIQ — AI-Powered QR Maintenance & Asset History Platform

MaintainIQ is a professional maintenance management platform that gives physical assets a digital identity, a QR-accessible public page, an issue-reporting workflow, a permanent service history, and preventive recommendations.

This is a **frontend-only React prototype** designed for Batch 16-20 student evaluations. All backend databases and operations are modeled on the client side using `localStorage` persistence, enabling a complete, self-contained demonstration of multi-role workflows.

---

## 🌟 Core Features

1. **Floating Role Simulation Hub**: Switch between **Reporter / Public User**, **Administrator**, **Technician**, and **Supervisor** roles instantly to experience the full lifecycle.
2. **Dual-Mode AI Issue Triage**:
   - **Google Gemini 1.5 Flash Integration**: Input your API Key in Settings (saved securely in your browser's local storage). The app makes direct structured JSON requests to the official Google Gemini API.
   - **High-Fidelity Local Fallback**: If no key is provided, a smart keyword parser simulates realistic, structured diagnostic suggestions for common complaints.
3. **AI Modification Tracking**: Stores whether a field was suggested by the AI and whether the reporter manually edited it (shows small `AI SUGGESTED` / `AI EDITED` badges).
4. **Printable QR Asset Labels (Single & Bulk)**:
   - Dynamic QR codes generated using standard URL encoding.
   - Printable layouts with dashed cut lines, organization branding, code, location, and instructions.
   - Injects print media style overrides: clicking **Print** triggers browser layouts showing *only* the labels, hiding the application UI.
5. **Interactive Technician Stepper**: A structured step-by-step console (`Assigned` ➔ `Inspect` ➔ `Repair` ➔ `Resolve`) enforcing workflow rules and validations (e.g. no negative costs, completion notes required, and futuristic service scheduling).
6. **Timeline Auditing**: Generates read-only chronological history logs for every action (assignments, logs, resolutions).

---

## 🚀 Quick Start

Ensure you have [Node.js](https://nodejs.org/) installed.

1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite local development server:
   ```bash
   npm run dev
   ```
4. Open the displayed URL (usually `http://localhost:5173`) in your web browser.

---

## 📝 Demo Scenario Evaluation Guide

To demonstrate the full capability of the platform, execute the following workflow:

### Step 1: Simulated Scanning & AI Issue Triage
1. Click the **Public Reporter** button in the floating top simulation bar.
2. If you are on the simulator home page, choose an asset tag to scan (e.g. `CR-PROJ-01 - Classroom Projector 01`) and click **Simulate QR Tag Scan**.
3. Click the **Report Malfunction or Issue** button.
4. Type a natural complaint in the text box:
   > *"The projector display keeps flickering and cuts out to a blank screen when we plug in the HDMI cable."*
5. Click **Analyze Complaint with GenAI**.
   - Notice the pulse loaders (processing lag can be adjusted in settings!).
   - Review the structured diagnostic result (possible causes, safety checklist, suggested title, category, and priority).
6. Edit the suggested Title slightly (e.g., change it to *"Flickering Display and Loose HDMI"*).
   - Note the badge next to the title changes from `AI SUGGESTED` to `AI EDITED`.
7. Enter a reporter name (e.g. *"John Doe"*) and submit. A unique Ticket ID (e.g. `ISS-1002`) is generated.

### Step 2: Inspection & Workflow Assignment
1. Switch to the **Administrator** role in the top simulation bar.
2. Select **Issues Board** in the sidebar. Locate your newly reported issue.
3. Select the ticket to open the details panel.
4. Review the AI-suggested diagnostic checklist and causes logged with the ticket.
5. Under **Assign Maintenance Staff**, choose **Alice Miller** from the technician dropdown and click **Assign**.
   - The ticket status advances to `Assigned` and is dispatched to Alice.

### Step 3: Technician Resolution
1. Switch to the **Technician** role in the top simulation bar.
2. The technician portal displays Alice Miller's assigned tasks. Click **Inspect** on your ticket.
3. Use the **Stepper Console**:
   - Click **Start Inspection** (advances status to `Inspection Started`; flags the asset as `Under Inspection`).
   - Click **Begin Maintenance & Repair Work** (advances status to `Maintenance In Progress`; flags asset as `Under Maintenance`).
4. Fill out the resolution details:
   - *Findings*: *"HDMI port connection pin was bent."*
   - *Work Notes*: *"Replaced the HDMI cable and secured the wall socket plate."*
   - *Parts Replaced*: *"1x 10ft Gold HDMI Cable"*
   - *Cost*: Enter `30` (test entering negative numbers, they are blocked!).
   - *Next Service*: Schedule a date in the future (past dates are blocked!).
5. Submit the resolution. The asset status synchronizes back to `Operational`.

### Step 4: Supervisor Oversight & Timeline Check
1. Switch to the **Supervisor** role. Go to **Issues Board** and inspect the ticket.
2. Review technician findings and cost metrics. Click **Approve & Close Ticket** to archive.
3. Switch back to **Administrator** role and go to **Assets Directory**.
4. Click on **Classroom Projector 01**.
5. Scroll down to review the **Timeline History**: Note the automated, chronological, read-only audit log tracking every transition from the reporter's AI report, assignment, inspection updates, and supervisor closure.

---

## 🛠️ Settings & Configurations
Go to **Settings** in the sidebar (Admin view) to:
- Enter your **Google Gemini API Key** to enable live model triage.
- Rename the **Organization Name** printed on labels.
- Increase the **AI Processing Latency Simulator** slider to review loading transitions.
- **Restore Initial Database Seeds** if you want to wipe custom edits and restart a clean demo.
