/**
 * MemeApp Minimal Moderation Console Controller
 * Supports role-based access control, report inspection, content/user actions,
 * and immutable moderation audit logging.
 */

// Simulated Data Store (initialized with seed data mirrors)
const state = {
  currentUser: {
    id: "00000000-0000-0000-0000-000000000001",
    email: "mod@memeapp.internal",
    role: "moderator" // 'moderator' | 'admin' | 'user'
  },
  currentFilter: "open",
  selectedReportId: null,
  
  users: {
    "00000000-0000-0000-0000-000000000001": { id: "00000000-0000-0000-0000-000000000001", username: "mod_lead", status: "active", postCount: 0 },
    "11111111-1111-1111-1111-111111111111": { id: "11111111-1111-1111-1111-111111111111", username: "user_a", status: "active", postCount: 5 },
    "22222222-2222-2222-2222-222222222222": { id: "22222222-2222-2222-2222-222222222222", username: "user_b", status: "active", postCount: 3 },
    "33333333-3333-3333-3333-333333333333": { id: "33333333-3333-3333-3333-333333333333", username: "spammer_99", status: "restricted", postCount: 8 },
    "44444444-4444-4444-4444-444444444444": { id: "44444444-4444-4444-4444-444444444444", username: "bad_actor_x", status: "active", postCount: 2 }
  },

  memes: {
    "m-seed-01": {
      id: "m-seed-01",
      creatorId: "44444444-4444-4444-4444-444444444444",
      caption: "Suspect meme with questionable hate content",
      status: "published",
      category: "Dark Humor",
      imageUrl: "https://picsum.photos/seed/meme01/400/400"
    },
    "m-seed-02": {
      id: "m-seed-02",
      creatorId: "33333333-3333-3333-3333-333333333333",
      caption: "Mass scam spam crypto referral meme",
      status: "published",
      category: "Tech",
      imageUrl: "https://picsum.photos/seed/meme02/400/400"
    },
    "m-seed-03": {
      id: "m-seed-03",
      creatorId: "11111111-1111-1111-1111-111111111111",
      caption: "Normal wholesome programming joke",
      status: "published",
      category: "Wholesome",
      imageUrl: "https://picsum.photos/seed/meme03/400/400"
    }
  },

  reports: [
    {
      id: "rep-001",
      reporterId: "22222222-2222-2222-2222-222222222222",
      targetType: "meme",
      targetId: "m-seed-01",
      reason: "hate_speech",
      reasonDisplay: "Hate or Harassment",
      details: "This meme targets a protected group with offensive harassment language.",
      status: "open",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      reviewedAt: null,
      reviewedBy: null
    },
    {
      id: "rep-002",
      reporterId: "11111111-1111-1111-1111-111111111111",
      targetType: "meme",
      targetId: "m-seed-02",
      reason: "spam_scams",
      reasonDisplay: "Spam or Scams",
      details: "Malicious link embedded in watermarked telegram scam bot.",
      status: "open",
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      reviewedAt: null,
      reviewedBy: null
    },
    {
      id: "rep-003",
      reporterId: "22222222-2222-2222-2222-222222222222",
      targetType: "user",
      targetId: "44444444-4444-4444-4444-444444444444",
      reason: "impersonation",
      reasonDisplay: "Impersonation",
      details: "User is posing as a verified MemeApp team developer.",
      status: "open",
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      reviewedAt: null,
      reviewedBy: null
    },
    {
      id: "rep-004",
      reporterId: "11111111-1111-1111-1111-111111111111",
      targetType: "meme",
      targetId: "m-seed-03",
      reason: "spam_scams",
      reasonDisplay: "Spam or Scams",
      details: "Misunderstanding, thought it was a promotional ad.",
      status: "dismissed",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      reviewedAt: new Date(Date.now() - 80000000).toISOString(),
      reviewedBy: "00000000-0000-0000-0000-000000000001"
    }
  ],

  auditLog: [
    {
      id: "audit-001",
      moderatorId: "00000000-0000-0000-0000-000000000001",
      targetType: "meme",
      targetId: "m-seed-03",
      action: "dismiss_report",
      reason: "False positive review",
      notes: "Content does not violate community guidelines.",
      previousState: "open",
      newState: "dismissed",
      createdAt: new Date(Date.now() - 80000000).toISOString()
    }
  ]
};

// Authorization Check
function isAuthorizedModerator() {
  return state.currentUser && (state.currentUser.role === 'moderator' || state.currentUser.role === 'admin');
}

// UI Initialization
document.addEventListener("DOMContentLoaded", () => {
  updateUserBadge();
  renderQueue();
  renderAuditLog();
});

function updateUserBadge() {
  const badge = document.getElementById("moderatorBadge");
  if (isAuthorizedModerator()) {
    badge.innerHTML = `🛡️ <strong>${state.currentUser.email}</strong> [${state.currentUser.role.toUpperCase()}]`;
    badge.style.color = "var(--accent-cyan)";
    badge.style.borderColor = "var(--accent-cyan)";
  } else {
    badge.innerHTML = `⛔ <strong>${state.currentUser.email}</strong> [UNAUTHORIZED USER]`;
    badge.style.color = "var(--danger)";
    badge.style.borderColor = "var(--danger)";
  }
}

// Filter Navigation
function setFilter(filter) {
  state.currentFilter = filter;
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-filter") === filter);
  });
  renderQueue();
}

// Render Queue
function renderQueue() {
  const queueEl = document.getElementById("queueList");
  const countBadge = document.getElementById("queueCount");

  if (!isAuthorizedModerator()) {
    queueEl.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--danger);">
        <strong>403 Access Denied</strong><br>
        <span style="font-size: 0.8rem; color: var(--text-muted);">
          Supabase RLS Policy <code>reports_moderator_select</code> denies normal users from viewing the moderation queue.
        </span>
      </div>`;
    countBadge.textContent = "Denied";
    countBadge.className = "badge badge-dismissed";
    document.getElementById("detailEmpty").style.display = "flex";
    document.getElementById("detailContent").style.display = "none";
    return;
  }

  const openCount = state.reports.filter(r => r.status === "open").length;
  countBadge.textContent = `${openCount} open`;
  countBadge.className = openCount > 0 ? "badge badge-open" : "badge badge-resolved";

  const filtered = state.reports.filter(r => {
    if (state.currentFilter === "all") return true;
    return r.status === state.currentFilter;
  });

  if (filtered.length === 0) {
    queueEl.innerHTML = `
      <div style="padding: 30px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
        No ${state.currentFilter} reports found.
      </div>`;
    return;
  }

  queueEl.innerHTML = filtered.map(r => `
    <div class="report-item ${state.selectedReportId === r.id ? 'selected' : ''}" onclick="selectReport('${r.id}')">
      <div class="report-item-header">
        <span class="badge badge-${r.targetType}">${r.targetType.toUpperCase()}</span>
        <span class="badge badge-${r.status}">${r.status}</span>
      </div>
      <div class="report-reason">${escapeHtml(r.reasonDisplay || r.reason)}</div>
      <div class="report-snippet">${escapeHtml(r.details || "No details provided")}</div>
      <div class="report-date">${new Date(r.createdAt).toLocaleString()}</div>
    </div>
  `).join("");
}

// Select Report
function selectReport(reportId) {
  if (!isAuthorizedModerator()) return;
  state.selectedReportId = reportId;
  renderQueue();

  const report = state.reports.find(r => r.id === reportId);
  if (!report) return;

  document.getElementById("detailEmpty").style.display = "none";
  document.getElementById("detailContent").style.display = "block";

  // Populate report fields
  document.getElementById("detailReportId").textContent = report.id;
  document.getElementById("detailReportStatus").innerHTML = `<span class="badge badge-${report.status}">${report.status}</span>`;
  document.getElementById("detailReportReason").textContent = report.reasonDisplay || report.reason;
  document.getElementById("detailReportDate").textContent = new Date(report.createdAt).toLocaleString();
  document.getElementById("detailReporterId").textContent = report.reporterId;
  document.getElementById("detailReportDetails").textContent = report.details || "None";

  // Target preview
  const memeBox = document.getElementById("targetMemeBox");
  const userBox = document.getElementById("targetUserBox");

  if (report.targetType === "meme") {
    memeBox.style.display = "flex";
    userBox.style.display = "none";
    document.getElementById("detailTargetHeader").textContent = "Target Meme Overview";

    const meme = state.memes[report.targetId] || {
      id: report.targetId,
      caption: "Meme record",
      status: "published",
      creatorId: "unknown",
      category: "General",
      imageUrl: "https://picsum.photos/seed/default/400/400"
    };

    const creator = state.users[meme.creatorId] || { username: meme.creatorId };

    document.getElementById("targetMemeThumb").src = meme.imageUrl;
    document.getElementById("targetMemeId").textContent = meme.id;
    document.getElementById("targetMemeCaption").textContent = meme.caption;
    document.getElementById("targetMemeCreator").textContent = `@${creator.username}`;
    document.getElementById("targetMemeStatus").textContent = meme.status;
    document.getElementById("targetMemeStatus").className = `badge badge-${meme.status === 'published' ? 'resolved' : 'dismissed'}`;
    document.getElementById("targetMemeCategory").textContent = meme.category;

    // Enable/disable appropriate action buttons
    document.getElementById("btnHideContent").style.display = meme.status === "hidden" ? "none" : "inline-block";
    document.getElementById("btnRemoveContent").style.display = meme.status === "removed" ? "none" : "inline-block";
    document.getElementById("btnRestoreContent").style.display = meme.status !== "published" ? "inline-block" : "none";
    document.getElementById("btnRestrictUser").style.display = "inline-block";
    document.getElementById("btnSuspendUser").style.display = "inline-block";
    document.getElementById("btnBanUser").style.display = "inline-block";

    // History count
    const historyCount = state.reports.filter(r => r.targetId === report.targetId).length;
    document.getElementById("targetReportHistoryCount").textContent = historyCount;

  } else {
    memeBox.style.display = "none";
    userBox.style.display = "flex";
    document.getElementById("detailTargetHeader").textContent = "Target Creator Overview";

    const user = state.users[report.targetId] || {
      id: report.targetId,
      username: "unknown_user",
      status: "active",
      postCount: 0
    };

    document.getElementById("targetUserId").textContent = user.id;
    document.getElementById("targetUsername").textContent = `@${user.username}`;
    document.getElementById("targetUserStatus").textContent = user.status;
    document.getElementById("targetUserStatus").className = `badge badge-${user.status === 'active' ? 'resolved' : 'open'}`;
    document.getElementById("targetUserPostCount").textContent = user.postCount;

    // Content buttons not applicable directly on user target
    document.getElementById("btnHideContent").style.display = "none";
    document.getElementById("btnRemoveContent").style.display = "none";
    document.getElementById("btnRestoreContent").style.display = "none";
    document.getElementById("btnRestrictUser").style.display = user.status === "restricted" ? "none" : "inline-block";
    document.getElementById("btnSuspendUser").style.display = user.status === "suspended" ? "none" : "inline-block";
    document.getElementById("btnBanUser").style.display = user.status === "banned" ? "none" : "inline-block";

    // History count
    const historyCount = state.reports.filter(r => r.targetId === report.targetId).length;
    document.getElementById("targetReportHistoryCount").textContent = historyCount;
  }

  // Clear notes field
  document.getElementById("actionNotes").value = "";
}

// Moderation Action Handler
function handleModerationAction(actionType) {
  if (!isAuthorizedModerator()) {
    alert("Authorization Error: Normal users cannot execute moderation actions.");
    return;
  }

  const report = state.reports.find(r => r.id === state.selectedReportId);
  if (!report) return;

  const notes = document.getElementById("actionNotes").value.trim();
  const now = new Date().toISOString();
  let previousState = "";
  let newState = "";
  let targetType = report.targetType;
  let targetId = report.targetId;

  if (actionType === "hide_content") {
    const meme = state.memes[report.targetId];
    if (meme) {
      previousState = meme.status;
      meme.status = "hidden";
      newState = "hidden";
    }
    report.status = "resolved";
    report.reviewedAt = now;
    report.reviewedBy = state.currentUser.id;

  } else if (actionType === "remove_content") {
    const meme = state.memes[report.targetId];
    if (meme) {
      previousState = meme.status;
      meme.status = "removed";
      newState = "removed";
    }
    report.status = "resolved";
    report.reviewedAt = now;
    report.reviewedBy = state.currentUser.id;

  } else if (actionType === "restore_content") {
    const meme = state.memes[report.targetId];
    if (meme) {
      previousState = meme.status;
      meme.status = "published";
      newState = "published";
    }

  } else if (actionType === "restrict_user" || actionType === "suspend_user" || actionType === "ban_user") {
    let userId = report.targetType === "user" ? report.targetId : (state.memes[report.targetId]?.creatorId || report.targetId);
    targetType = "user";
    targetId = userId;
    const user = state.users[userId];
    const enforcementMap = {
      restrict_user: "restricted",
      suspend_user: "suspended",
      ban_user: "banned"
    };
    if (user) {
      previousState = user.status;
      user.status = enforcementMap[actionType];
      newState = user.status;
    }
    report.status = "resolved";
    report.reviewedAt = now;
    report.reviewedBy = state.currentUser.id;

  } else if (actionType === "dismiss") {
    previousState = report.status;
    report.status = "dismissed";
    newState = "dismissed";
    report.reviewedAt = now;
    report.reviewedBy = state.currentUser.id;
  }

  // Create immutable audit event
  const auditEvent = {
    id: "audit-" + String(state.auditLog.length + 1).padStart(3, "0"),
    moderatorId: state.currentUser.id,
    targetType: targetType,
    targetId: targetId,
    action: actionType,
    reason: report.reason,
    notes: notes || `Moderator performed ${actionType}`,
    previousState: previousState,
    newState: newState,
    createdAt: now
  };

  state.auditLog.unshift(auditEvent);

  // Refresh UI
  selectReport(report.id);
  renderQueue();
  renderAuditLog();
}

// Render Audit Log
function renderAuditLog() {
  const auditEl = document.getElementById("auditList");
  auditEl.innerHTML = state.auditLog.map(ev => `
    <div class="audit-entry">
      <div class="audit-entry-header">
        <span class="audit-action">${escapeHtml(ev.action)}</span>
        <span class="audit-date">${new Date(ev.createdAt).toLocaleTimeString()}</span>
      </div>
      <div><strong>Target:</strong> ${ev.targetType}:${ev.targetId.slice(0, 8)}</div>
      <div><strong>Transition:</strong> <code>${ev.previousState || '-'}</code> → <code>${ev.newState || '-'}</code></div>
      ${ev.notes ? `<div class="audit-notes">"${escapeHtml(ev.notes)}"</div>` : ''}
    </div>
  `).join("");
}

// Auth Switcher
function openAuthModal() {
  document.getElementById("authModal").style.display = "flex";
  document.getElementById("authError").style.display = "none";
}

function onPresetChange() {
  const preset = document.getElementById("authPresetSelect").value;
  if (preset === "moderator") {
    document.getElementById("authUserId").value = "00000000-0000-0000-0000-000000000001";
    document.getElementById("authUserEmail").value = "mod@memeapp.internal";
    document.getElementById("authUserRole").value = "moderator";
  } else if (preset === "admin") {
    document.getElementById("authUserId").value = "00000000-0000-0000-0000-000000000002";
    document.getElementById("authUserEmail").value = "lead@memeapp.internal";
    document.getElementById("authUserRole").value = "admin";
  } else {
    document.getElementById("authUserId").value = "11111111-1111-1111-1111-111111111111";
    document.getElementById("authUserEmail").value = "alice@example.com";
    document.getElementById("authUserRole").value = "user";
  }
}

function applyAuth() {
  const role = document.getElementById("authUserRole").value;
  const email = document.getElementById("authUserEmail").value;
  const id = document.getElementById("authUserId").value;

  state.currentUser = { id, email, role };
  document.getElementById("authModal").style.display = "none";

  updateUserBadge();
  renderQueue();
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
