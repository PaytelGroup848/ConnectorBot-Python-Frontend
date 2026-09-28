/**
 * Modern Clean SaaS Customer Support Ticket PDF Generator
 * Designed for CtrlBooks (Stripe / Linear / Freshdesk Enterprise Standard)
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
    hour12: true,
  })

  const company = ticket.company || 'Annai Agency'
  const diag = ticket.diagnostics || {}
  const activePort = diag.tally_port || 9000
  const isOnline = (diag.tally_connector || '').toUpperCase() === 'ONLINE'
  const statusUpper = (ticket.status || 'OPEN').toUpperCase()
  const priorityUpper = (ticket.priority || 'STANDARD').toUpperCase()
  const isUrgent = priorityUpper === 'HIGH' || priorityUpper === 'URGENT'

  // Clean logo URL from origin
  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/ctrlbooks-logo.png` : '/ctrlbooks-logo.png'

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>CtrlBooks_Support_Ticket_${ticket.ticket_id}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 24px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      -webkit-font-smoothing: antialiased;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .no-print { display: none !important; }
      .ticket-container { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
    }

    /* Screen Action Bar */
    .toolbar {
      max-width: 800px;
      margin: 0 auto 16px auto;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 8px 20px -4px rgba(15, 23, 42, 0.2);
    }
    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      font-weight: 600;
    }
    .toolbar-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
    }
    .toolbar-actions { display: flex; gap: 10px; }
    .btn-print {
      background: #0284c7;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .btn-print:hover { background: #0369a1; }
    .btn-close {
      background: rgba(255,255,255,0.1);
      color: #cbd5e1;
      border: 1px solid rgba(255,255,255,0.15);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-close:hover { background: rgba(255,255,255,0.18); }

    /* Main Ticket Container */
    .ticket-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.06);
      overflow: hidden;
      padding: 32px 36px;
    }

    /* Top Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 24px;
      border-bottom: 1px solid #f1f5f9;
      margin-bottom: 24px;
    }
    .brand-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo-img {
      height: 48px;
      width: auto;
      object-fit: contain;
    }
    .brand-logo-svg {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .header-meta {
      text-align: right;
    }
    .ticket-id-badge {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.2px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      margin-bottom: 6px;
    }
    .id-tag {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 3px 8px;
      border-radius: 6px;
      font-family: ui-monospace, monospace;
      font-size: 13px;
    }
    .status-pill {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: ${statusUpper === 'RESOLVED' || statusUpper === 'CLOSED' ? '#ecfdf5' : '#f0fdf4'};
      color: ${statusUpper === 'RESOLVED' || statusUpper === 'CLOSED' ? '#047857' : '#16a34a'};
      border: 1px solid ${statusUpper === 'RESOLVED' || statusUpper === 'CLOSED' ? '#a7f3d0' : '#bbf7d0'};
    }
    .created-time {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }

    /* Clean Card Section */
    .section-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px 22px;
      margin-bottom: 18px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #64748b;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Customer Grid */
    .customer-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 24px;
    }
    .field-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .field-label {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
    }
    .field-value {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
    }

    /* Issue Summary Box */
    .issue-callout {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #0284c7;
      border-radius: 8px;
      padding: 14px 18px;
      font-size: 13.5px;
      color: #1e293b;
      line-height: 1.5;
    }
    .issue-subject-line {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .issue-desc {
      color: #475569;
      font-size: 13px;
    }

    /* Tally Health Pills */
    .health-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }
    .health-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
    }
    .pill-red {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }
    .pill-green {
      background: #f0fdf4;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }
    .pill-slate {
      background: #f8fafc;
      color: #334155;
      border: 1px solid #e2e8f0;
    }
    .pill-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }
    .dot-red { background: #ef4444; }
    .dot-green { background: #22c55e; }
    .dot-slate { background: #64748b; }

    /* Actionable Checklist */
    .action-list {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .action-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 13px;
      color: #334155;
      line-height: 1.45;
    }
    .action-step-num {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #e0f2fe;
      color: #0369a1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* Minimalist Footer */
    .footer {
      margin-top: 28px;
      padding-top: 20px;
      border-top: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11.5px;
      color: #64748b;
    }
    .footer-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .footer-link {
      color: #0284c7;
      text-decoration: none;
      font-weight: 600;
    }
    .footer-verified {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #10b981;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <!-- Screen Floating Bar -->
  <div class="toolbar no-print">
    <div class="toolbar-left">
      <span class="toolbar-dot"></span>
      <span>CtrlBooks Support Ticket • #${ticket.ticket_id}</span>
    </div>
    <div class="toolbar-actions">
      <button class="btn-print" onclick="window.print()">🖨️ Save as PDF / Print</button>
      <button class="btn-close" onclick="window.close()">✕ Close</button>
    </div>
  </div>

  <!-- Printable Ticket Document -->
  <div class="ticket-container">
    <!-- Header -->
    <div class="header">
      <div class="brand-wrap">
        <!-- Official Logo Image with SVG fallback -->
        <img
          src="${logoUrl}"
          alt="CtrlBooks Logo"
          class="brand-logo-img"
          onerror="this.style.display='none'; document.getElementById('svg-fallback').style.display='flex';"
        />
        <div id="svg-fallback" class="brand-logo-svg" style="display: none;">
          <svg width="38" height="38" viewBox="0 0 100 100">
            <polygon points="50,5 15,25 15,75 50,95" fill="#0084d6"/>
            <polygon points="50,5 85,25 85,75 50,95" fill="#43b02a"/>
            <circle cx="50" cy="50" r="14" fill="#ffffff"/>
            <circle cx="44" cy="50" r="7" fill="#0084d6"/>
            <circle cx="56" cy="50" r="7" fill="#43b02a"/>
          </svg>
          <div>
            <span style="font-size: 20px; font-weight: 800; color: #43b02a;">Ctrl</span><span style="font-size: 20px; font-weight: 800; font-style: italic; color: #0084d6;">Books</span>
          </div>
        </div>
      </div>

      <div class="header-meta">
        <div class="ticket-id-badge">
          <span>Ticket ID:</span>
          <span class="id-tag">#${ticket.ticket_id}</span>
          <span class="status-pill">${statusUpper}</span>
        </div>
        <div class="created-time">Created: ${formattedDate} • ${formattedTime}</div>
      </div>
    </div>

    <!-- Section 1: Customer & Company -->
    <div class="section-card">
      <div class="section-title">Customer & Organization Details</div>
      <div class="customer-grid">
        <div class="field-group">
          <span class="field-label">Organization Name</span>
          <span class="field-value">${company}</span>
        </div>
        <div class="field-group">
          <span class="field-label">Reported By</span>
          <span class="field-value">${ticket.user_id && ticket.user_id !== 'usr_default_admin' ? ticket.user_id : 'Authorized User'}</span>
        </div>
        <div class="field-group">
          <span class="field-label">Assigned Department</span>
          <span class="field-value">${ticket.department || 'Tally Support & Operations'}</span>
        </div>
        <div class="field-group">
          <span class="field-label">Priority Tier</span>
          <span class="field-value" style="color: ${isUrgent ? '#dc2626' : '#0284c7'};">${priorityUpper}</span>
        </div>
      </div>
    </div>

    <!-- Section 2: Issue Summary -->
    <div class="section-card">
      <div class="section-title">Issue Summary</div>
      <div class="issue-callout">
        <div class="issue-subject-line">${ticket.subject}</div>
        ${ticket.description && ticket.description !== ticket.subject ? `<div class="issue-desc">"${ticket.description}"</div>` : ''}
      </div>
    </div>

    <!-- Section 3: Tally System Health -->
    <div class="section-card">
      <div class="section-title">Tally Connection Health</div>
      <div class="health-row">
        <div class="health-pill ${isOnline ? 'pill-green' : 'pill-red'}">
          <span class="pill-dot ${isOnline ? 'dot-green' : 'dot-red'}"></span>
          <span>Tally Connector: ${isOnline ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
        <div class="health-pill pill-slate">
          <span class="pill-dot dot-slate"></span>
          <span>Port: ${activePort}</span>
        </div>
        <div class="health-pill pill-slate">
          <span class="pill-dot dot-slate"></span>
          <span>Sync Queue: ${diag.pending_queue_items ?? 0} Vouchers Pending</span>
        </div>
        ${diag.agent_version ? `
        <div class="health-pill pill-slate">
          <span>Agent: v${diag.agent_version}</span>
        </div>` : ''}
      </div>
    </div>

    <!-- Section 4: AI Recommended Next Steps -->
    <div class="section-card" style="margin-bottom: 0;">
      <div class="section-title">⚡ AI Recommended Next Steps</div>
      <ol class="action-list">
        <li class="action-item">
          <span class="action-step-num">1</span>
          <span><strong>Verify Tally Prime is Running:</strong> Ensure the Tally application is open on the host machine and the target company is loaded.</span>
        </li>
        <li class="action-item">
          <span class="action-step-num">2</span>
          <span><strong>Check ODBC/HTTP Server:</strong> In Tally Prime, press <strong>F12</strong> &rarr; go to <strong>Advanced Configuration</strong> &rarr; ensure <em>'Enable ODBC Server'</em> is set to <strong>Yes</strong>.</span>
        </li>
        <li class="action-item">
          <span class="action-step-num">3</span>
          <span><strong>Verify Port & Firewall:</strong> Confirm that port <strong>${activePort}</strong> is allowed in Windows Defender Firewall for TCP traffic.</span>
        </li>
        <li class="action-item">
          <span class="action-step-num">4</span>
          <span><strong>Trigger Synchronization:</strong> Re-open CtrlBooks Connector to establish the handshake. ${diag.engineer_playbook ? `<br/><span style="color:#0369a1;font-size:12px;"><strong>Note:</strong> ${diag.engineer_playbook}</span>` : ''}</span>
        </li>
      </ol>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-left">
        <span>Powered by <strong>CtrlBooks Support</strong></span>
        <span>•</span>
        <span>Helpline: <strong>+91 9311472357</strong></span>
        <span>•</span>
        <a href="mailto:support@ctrlbooks.com" class="footer-link">support@ctrlbooks.com</a>
      </div>
      <div class="footer-verified">
        <span>✔</span>
        <span>Digitally Verified by CtrlBooks AI</span>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`

  const printWindow = window.open('', '_blank', 'width=880,height=840')
  if (printWindow) {
    printWindow.document.open()
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }
}
