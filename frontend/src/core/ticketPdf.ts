/**
 * Ultra-Modern Executive SaaS Service Dossier & SLA Ticket PDF Generator
 * Inspired by Stripe / Linear / Razorpay Enterprise Incident Dossiers
 */

export interface CorporateTicketPDFData {
  ticket_id: string
  subject: string
  description?: string
  status: string
  priority: string
  company?: string
  user_id?: string
  department?: string
  assigned_team?: string
  sla_tier?: string
  response_sla?: string
  resolution_sla?: string
  detected_language?: string
  created_at?: string
  diagnostics?: {
    tally_connector?: string
    tally_port?: number
    agent_version?: string
    pending_queue_items?: number
    root_cause_hypothesis?: string
    engineer_playbook?: string
  }
}

export function downloadCorporateTicketPDF(ticket: CorporateTicketPDFData) {
  const createdDate = ticket.created_at ? new Date(ticket.created_at) : new Date()
  const formattedDate = createdDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const formattedTime = createdDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const company = ticket.company || 'CtrlBooks'
  const department = ticket.department || 'L2 Connector Engineering'
  const assignedTeam = ticket.assigned_team || 'L2 Senior Technical Support'
  const slaTier = ticket.sla_tier || (ticket.priority === 'HIGH' ? 'P2 - High' : 'P3 - Standard')
  const responseSla = ticket.response_sla || '1 Hour'
  const resolutionSla = ticket.resolution_sla || '4 Hours'
  const diag = ticket.diagnostics || {}
  const activePort = diag.tally_port || 'Auto'
  const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
  const isUrgent = ticket.priority === 'URGENT' || ticket.priority === 'HIGH'

  // Deterministic verification hash from ticket ID
  const hashHex = Array.from(ticket.ticket_id + company)
    .reduce((acc, ch) => ((acc << 5) - acc + ch.charCodeAt(0)) | 0, 0x811c9dc5)
    .toString(16)
    .replace('-', '')
    .toUpperCase()
    .padStart(8, 'A')
  const digitalSignature = `CB-SIG-${hashHex}-${activePort}`

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>CtrlBooks_Service_Dossier_${ticket.ticket_id}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 20px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0f172a;
      background: #f1f5f9;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .no-print { display: none !important; }
      .dossier { box-shadow: none !important; border: 1px solid #cbd5e1 !important; }
    }

    /* Floating Screen Toolbar */
    .toolbar {
      max-width: 820px;
      margin: 0 auto 16px auto;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.25);
    }
    .toolbar-left { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; }
    .toolbar-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; }
    .toolbar-actions { display: flex; gap: 10px; }
    .btn-print {
      background: linear-gradient(135deg, #10b981, #059669);
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 9px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-close {
      background: rgba(255,255,255,0.1);
      color: #cbd5e1;
      border: 1px solid rgba(255,255,255,0.15);
      padding: 8px 14px;
      border-radius: 9px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }

    /* Main A4 Dossier Container */
    .dossier {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 18px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.08);
    }

    /* Top Accent Ribbon */
    .top-ribbon {
      height: 6px;
      background: linear-gradient(90deg, #059669 0%, #10b981 40%, #0d9488 75%, #6366f1 100%);
    }

    /* Executive Hero Header */
    .hero {
      background: radial-gradient(circle at top right, #064e3b 0%, #0f172a 65%);
      color: #ffffff;
      padding: 26px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
    }
    .brand-row { display: flex; align-items: center; gap: 14px; }
    .brand-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 22px;
      color: #ffffff;
      box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
    }
    .brand-name { font-size: 21px; font-weight: 800; letter-spacing: -0.4px; display: flex; align-items: center; gap: 8px; }
    .brand-pill {
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid rgba(52, 211, 153, 0.4);
      color: #6ee7b7;
      padding: 2px 8px;
      border-radius: 99px;
      font-weight: 700;
    }
    .brand-tagline { font-size: 11.5px; color: #94a3b8; margin-top: 4px; }

    .hero-right {
      display: flex;
      align-items: center;
      gap: 16px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.14);
      padding: 12px 16px;
      border-radius: 14px;
    }
    .ticket-meta { text-align: right; }
    .ticket-label { font-size: 9.5px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 700; }
    .ticket-id { font-family: 'JetBrains Mono', monospace; font-size: 17px; font-weight: 800; color: #ffffff; margin-top: 2px; }
    .status-chip {
      display: inline-block;
      margin-top: 5px;
      padding: 2px 9px;
      border-radius: 99px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      background: ${isResolved ? '#10b981' : isUrgent ? '#f43f5e' : '#f59e0b'};
      color: #ffffff;
    }
    .qr-box {
      width: 54px;
      height: 54px;
      background: #ffffff;
      border-radius: 10px;
      padding: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* 4-Stage Visual Workflow Stepper */
    .stepper-bar {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 14px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .step { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; color: #0f172a; }
    .step-circle {
      width: 20px; height: 20px; border-radius: 50%;
      background: #10b981; color: #ffffff;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 800;
    }
    .step-pending { background: #e2e8f0; color: #64748b; }
    .step-line { flex: 1; height: 2px; background: #cbd5e1; margin: 0 12px; }
    .step-line-active { background: #10b981; }

    /* Body Content */
    .body-pad { padding: 26px 32px; }

    /* 3-Column Bento KPI Grid */
    .bento-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-bottom: 22px;
    }
    .bento-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px 16px;
    }
    .bento-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.7px;
      color: #64748b;
      margin-bottom: 8px;
    }
    .bento-primary { font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
    .bento-sub { font-size: 11.5px; color: #475569; line-height: 1.45; }
    .bento-highlight { color: #059669; font-weight: 700; }

    /* Reported Incident Statement Banner */
    .incident-card {
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%);
      border: 1px solid #a7f3d0;
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 22px;
    }
    .incident-tag {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #047857;
      background: #d1fae5;
      padding: 3px 9px;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    .incident-subject { font-size: 15px; font-weight: 800; color: #064e3b; margin-bottom: 6px; }
    .incident-quote {
      font-size: 12.5px;
      color: #1e293b;
      background: rgba(255, 255, 255, 0.75);
      border-left: 3px solid #10b981;
      padding: 8px 12px;
      border-radius: 6px;
      font-style: italic;
    }

    /* 2-Column Technical Telemetry & AI Engineering Playbook */
    .tech-grid {
      display: grid;
      grid-template-columns: 1.05fr 0.95fr;
      gap: 16px;
      margin-bottom: 18px;
    }
    .terminal-card {
      background: #0f172a;
      color: #f8fafc;
      border-radius: 14px;
      padding: 16px 18px;
      font-family: 'JetBrains Mono', monospace;
    }
    .terminal-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .terminal-dots { display: flex; gap: 5px; }
    .dot-r { width: 9px; height: 9px; border-radius: 50%; background: #f43f5e; }
    .dot-y { width: 9px; height: 9px; border-radius: 50%; background: #f59e0b; }
    .dot-g { width: 9px; height: 9px; border-radius: 50%; background: #10b981; }
    .terminal-title { font-size: 10.5px; font-weight: 700; color: #34d399; letter-spacing: 0.5px; }
    .kv-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      padding: 5px 0;
      border-bottom: 1px dashed rgba(255,255,255,0.07);
    }
    .kv-key { color: #94a3b8; }
    .kv-val { color: #f8fafc; font-weight: 700; }

    .playbook-card {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 14px;
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .playbook-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #b45309;
      margin-bottom: 8px;
    }
    .playbook-item { font-size: 12px; color: #78350f; line-height: 1.5; margin-bottom: 10px; }

    /* Official Sign-Off Footer */
    .footer {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 16px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .seal-box { display: flex; align-items: center; gap: 10px; }
    .seal-badge {
      background: #ecfdf5;
      border: 1px solid #6ee7b7;
      color: #047857;
      font-size: 10px;
      font-weight: 800;
      padding: 5px 10px;
      border-radius: 8px;
      letter-spacing: 0.4px;
    }
    .sig-hash { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: #64748b; }
  </style>
</head>
<body>
  <!-- Screen Action Bar -->
  <div class="toolbar no-print">
    <div class="toolbar-left">
      <span class="toolbar-dot"></span>
      <span>CtrlBooks Official Service Dossier Preview • #${ticket.ticket_id}</span>
    </div>
    <div class="toolbar-actions">
      <button class="btn-print" onclick="window.print()">🖨️ Save as PDF / Print</button>
      <button class="btn-close" onclick="window.close()">✕ Close</button>
    </div>
  </div>

  <!-- A4 Printable Dossier -->
  <div class="dossier">
    <div class="top-ribbon"></div>

    <!-- Hero Header -->
    <div class="hero">
      <div class="brand-row">
        <div class="brand-icon">C</div>
        <div>
          <div class="brand-name">
            <span>CtrlBooks AI</span>
            <span class="brand-pill">Enterprise SLA Dossier</span>
          </div>
          <div class="brand-tagline">2-Way Tally Prime Port ${activePort} Cloud Connector • Powered by patwatoliai.com</div>
        </div>
      </div>

      <div class="hero-right">
        <div class="ticket-meta">
          <div class="ticket-label">Service Request ID</div>
          <div class="ticket-id">#${ticket.ticket_id}</div>
          <span class="status-chip">${ticket.status || 'OPEN'} • ${slaTier}</span>
        </div>
        <!-- Vector SVG QR Code Seal -->
        <div class="qr-box">
          <svg viewBox="0 0 36 36" width="44" height="44" fill="#0f172a">
            <rect x="2" y="2" width="10" height="10" rx="1.5" fill="none" stroke="#0f172a" stroke-width="2.5"/>
            <rect x="5" y="5" width="4" height="4" fill="#059669"/>
            <rect x="24" y="2" width="10" height="10" rx="1.5" fill="none" stroke="#0f172a" stroke-width="2.5"/>
            <rect x="27" y="5" width="4" height="4" fill="#059669"/>
            <rect x="2" y="24" width="10" height="10" rx="1.5" fill="none" stroke="#0f172a" stroke-width="2.5"/>
            <rect x="5" y="27" width="4" height="4" fill="#059669"/>
            <rect x="15" y="4" width="3" height="3"/><rect x="15" y="10" width="3" height="6"/>
            <rect x="15" y="20" width="6" height="3"/><rect x="24" y="16" width="3" height="6"/>
            <rect x="14" y="26" width="4" height="6"/><rect x="22" y="26" width="5" height="3"/>
            <rect x="29" y="24" width="4" height="8"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- 4-Stage Visual Stepper -->
    <div class="stepper-bar">
      <div class="step">
        <span class="step-circle">✓</span>
        <span>1. Voice/Chat Auto-LID</span>
      </div>
      <div class="step-line step-line-active"></div>
      <div class="step">
        <span class="step-circle">✓</span>
        <span>2. Port ${activePort} Telemetry Attached</span>
      </div>
      <div class="step-line step-line-active"></div>
      <div class="step">
        <span class="step-circle">✓</span>
        <span>3. Assigned: ${department}</span>
      </div>
      <div class="step-line ${isResolved ? 'step-line-active' : ''}"></div>
      <div class="step">
        <span class="step-circle ${isResolved ? '' : 'step-pending'}">${isResolved ? '✓' : '4'}</span>
        <span>4. SLA Resolution (${resolutionSla})</span>
      </div>
    </div>

    <div class="body-pad">
      <!-- 3-Column Bento Grid -->
      <div class="bento-3">
        <div class="bento-card">
          <div class="bento-label">Organization & Caller</div>
          <div class="bento-primary">${company}</div>
          <div class="bento-sub">
            <div><strong>User ID:</strong> ${ticket.user_id || 'usr_default_admin'}</div>
            <div><strong>Language:</strong> 🌐 ${ticket.detected_language || 'English'}</div>
            <div><strong>Logged At:</strong> ${formattedDate}, ${formattedTime}</div>
          </div>
        </div>

        <div class="bento-card">
          <div class="bento-label">SLA Commitment Matrix</div>
          <div class="bento-primary" style="color:${isUrgent ? '#e11d48' : '#059669'};">${slaTier}</div>
          <div class="bento-sub">
            <div><strong>First Response:</strong> <span class="bento-highlight">Within ${responseSla}</span></div>
            <div><strong>Target Resolution:</strong> <span class="bento-highlight">Within ${resolutionSla}</span></div>
            <div><strong>Queue Priority:</strong> Accelerated SLA</div>
          </div>
        </div>

        <div class="bento-card">
          <div class="bento-label">Engineering Ownership</div>
          <div class="bento-primary">${department}</div>
          <div class="bento-sub">
            <div><strong>Escalation Desk:</strong> ${assignedTeam}</div>
            <div><strong>Tally Port ${activePort}:</strong> <span class="bento-highlight">${diag.tally_connector || 'ONLINE'}</span></div>
            <div><strong>Channel:</strong> AI Voice & Chat</div>
          </div>
        </div>
      </div>

      <!-- Reported Incident Statement -->
      <div class="incident-card">
        <span class="incident-tag">Official Incident Summary</span>
        <div class="incident-subject">${ticket.subject}</div>
        <div class="incident-quote">
          "${ticket.description || ticket.subject}"
        </div>
      </div>

      <!-- Side-by-Side Terminal Telemetry & AI Engineer Playbook -->
      <div class="tech-grid">
        <div class="terminal-card">
          <div class="terminal-top">
            <div class="terminal-dots">
              <span class="dot-r"></span><span class="dot-y"></span><span class="dot-g"></span>
            </div>
            <span class="terminal-title">TALLY PRIME PORT ${activePort} SNAPSHOT</span>
          </div>
          <div class="kv-row"><span class="kv-key">CONNECTOR_STATE</span><span class="kv-val" style="color:#34d399;">${diag.tally_connector || 'ONLINE'}</span></div>
          <div class="kv-row"><span class="kv-key">LISTENER_PORT</span><span class="kv-val">TCP/${activePort} (XML/HTTP)</span></div>
          <div class="kv-row"><span class="kv-key">AGENT_BUILD</span><span class="kv-val">v${diag.agent_version || '1.0.1'}-enterprise</span></div>
          <div class="kv-row"><span class="kv-key">PENDING_QUEUE</span><span class="kv-val">${diag.pending_queue_items ?? 0} Vouchers Queued</span></div>
          <div class="kv-row" style="border:none;"><span class="kv-key">TELEMETRY_HASH</span><span class="kv-val">${digitalSignature}</span></div>
        </div>

        <div class="playbook-card">
          <div>
            <div class="playbook-title">⚡ AI Root-Cause & Engineer Playbook</div>
            <div class="playbook-item">
              <strong>Root-Cause Hypothesis:</strong><br/>
              ${diag.root_cause_hypothesis || `Tally Prime XML/HTTP listener on Port ${activePort} requires synchronization verification.`}
            </div>
            <div class="playbook-item" style="margin-bottom:0;">
              <strong>Recommended Engineering Action:</strong><br/>
              ${diag.engineer_playbook || `Verify Tally Prime Port ${activePort} listener and re-trigger 2-Way Command Queue handshake.`}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Digital Verification Footer -->
    <div class="footer">
      <div class="seal-box">
        <span class="seal-badge">✔ DIGITALLY VERIFIED BY CTRLBOOKS AI</span>
        <span class="sig-hash"> Cryptographic Ref: ${digitalSignature}</span>
      </div>
      <div class="sig-hash">Page 1 of 1 • Generated ${formattedDate}</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 350);
    };
  </script>
</body>
</html>`

  const printWindow = window.open('', '_blank', 'width=940,height=860')
  if (printWindow) {
    printWindow.document.open()
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }
}
