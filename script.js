const $ = s => document.querySelector(s);
const searchWrap = $('#searchWrap'), chatFab = $('#chatFab'), overlay = $('#overlay'), modalContent = $('#modalContent');

let state = {
  role: null,
  user: null,
  activeMyNotesFilter: 'ALL',
  activeAdminReviewFilter: 'ALL',
  studentMessages: [],
  supportRequests: [],
  notes: [
    { id: 1, cat: 'Lecture Notes', subject: 'Artificial Intelligence', title: 'Intro to Neural Networks & Deep Learning', desc: 'Perceptrons, activation functions, and backpropagation explained with visual diagrams.', by: 'Zara', rating: 5, downloads: 24, status: 'Live' },
    { id: 2, cat: 'Cheat Sheet', subject: 'Cybersecurity', title: 'Linux Command Line & Nmap Reference', desc: 'Essential terminal commands, file permissions, and network scanning flags for labs.', by: 'Danish', rating: 4, downloads: 15, status: 'Live' },
    { id: 3, cat: 'Past Year Papers', subject: 'Operating Systems', title: '2025 Final Exam Solutions', desc: 'Worked solutions covering process scheduling, deadlocks, and virtual memory management.', by: 'Mei Ling', rating: 5, downloads: 17, status: 'Waiting for review' },
    { id: 4, cat: 'Summaries', subject: 'Software Engineering', title: 'Agile & Scrum Framework Guide', desc: 'Breakdown of sprint ceremonies, user stories, velocity tracking, and key team roles.', by: 'Sharath', rating: 4, downloads: 9, status: 'Waiting for review' }
  ],
  reports: [
    { id: 1, noteTitle: 'Week 6 tutorial solutions — linear algebra', reportedBy: 'Mei Lin Tan', reason: 'Academic integrity', status: 'Open', desc: 'Solutions match official solution manual word-for-word without permission.' },
    { id: 2, noteTitle: '2023 final paper with worked answers', reportedBy: 'Daniel Okoye', reason: 'Wrong information', status: 'Resolved', desc: 'Question 4 answer has incorrect matrix calculation.' }
  ],
  students: [
    ['Zara Sofea', 'zara@student.edu', 'BSc Artificial Intelligence, Year 2', 5, 'Active'],
    ['Danish Irfan', 'danish@student.edu', 'BSc Cybersecurity, Year 3', 7, 'Active'],
    ['Tan Mei Ling', 'meiling@student.edu', 'BSc Computer Science, Year 2', 6, 'Active'],
    ['Sharath Krishnan', 'sharath@student.edu', 'BSc Data Science, Year 1', 1, 'Suspended']
  ]
};

function toast(text) {
  const d = document.createElement('div');
  d.className = 'toast';
  d.textContent = text;
  document.body.append(d);
  setTimeout(() => d.remove(), 2200);
}

function showModal(html) {
  modalContent.innerHTML = html;
  overlay.classList.remove('hidden');
  modalContent.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);
}

function closeModal() {
  overlay.classList.add('hidden');
}

function navigateTo(viewId, query = '') {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = $('#view-' + viewId);
  if (target) target.classList.add('active');

  if (viewId === 'role') {
    state.user = null;
    state.role = null;
    updateHeader();
  } else if (viewId === 'browse') {
    renderBrowse(query);
  } else if (viewId === 'home') {
    renderHomeCards();
  } else if (viewId === 'myNotes') {
    renderMyNotes();
  } else if (viewId === 'admin') {
    renderAdminOverview();
  } else if (viewId === 'review') {
    renderAdminReview();
  } else if (viewId === 'reports') {
    renderReports();
  } else if (viewId === 'students') {
    renderStudents(query);
  }
}

function updateHeader() {
  searchWrap.classList.toggle('hidden', !state.user);
  chatFab.classList.remove('hidden');
  $('#studentNav').classList.toggle('hidden', state.role !== 'student');
  $('#adminNav').classList.toggle('hidden', state.role !== 'admin');
}

function signOut() {
  toast('Signed out');
  navigateTo('role');
}

document.querySelectorAll('.navdrop').forEach(drop => {
  const btn = drop.querySelector('.nav-btn');
  const menu = drop.querySelector('.dropdown');
  btn.onclick = e => {
    e.stopPropagation();
    document.querySelectorAll('.dropdown').forEach(m => m !== menu && m.classList.add('hidden'));
    menu.classList.toggle('hidden');
  };
});

document.onclick = e => {
  if (!e.target.closest('.navdrop')) {
    document.querySelectorAll('.dropdown').forEach(m => m.classList.add('hidden'));
  }
};

function createNoteCardHTML(n) {
  return `
    <article class="card" onclick="openNoteModal(${n.id})">
      <div class="muted">${n.cat} | ${n.subject}</div>
      <h3>${n.title}</h3>
      <p>${n.desc}</p>
      <div class="meta">
        <span>◯ ${n.by}</span>
        <span class="stars">★★★★★ <b>${n.rating}</b></span>
      </div>
    </article>`;
}

function openNoteModal(id) {
  const n = state.notes.find(x => x.id === id);
  if (!n) return;
  showModal(`
    <div class="modal-head">
      <div>
        <div class="muted">Browse / ${n.cat} / ${n.subject}</div>
        <h2>${n.title}</h2>
      </div>
      <button class="close" data-close>×</button>
    </div>
    <p><b>${n.by}</b> · ${n.downloads} downloads</p>
    <p>${n.desc}</p>
    <div class="drop">
      📄 ${n.file ? n.file.name : n.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.txt'}
      <button class="btn good" id="dlBtn">Download</button>
    </div>
    <br>
    <div class="panel">
      <h3>Rate these notes</h3>
      <div class="stars" id="ratingStars" style="font-size:28px; cursor:pointer;">☆ ☆ ☆ ☆ ☆</div>
      <label>Leave a comment (optional)
        <textarea id="commentInput" placeholder="What was useful? What was missing?"></textarea>
      </label>
      <button class="btn good" id="postRatingBtn">Post rating</button>
    </div>
    <div id="commentsWrap">
      <h3>Comments</h3>
      <p class="muted">No comments yet. Be the first to say whether this helped.</p>
    </div>
  `);

  let ratingVal = 0;
  $('#ratingStars').onclick = () => {
    let r = prompt('Rate 1–5 stars', '5');
    ratingVal = Math.max(1, Math.min(5, +r || 5));
    $('#ratingStars').textContent = '★ '.repeat(ratingVal) + '☆ '.repeat(5 - ratingVal);
  };

  $('#postRatingBtn').onclick = () => {
    n.rating = ratingVal || 5;
    let txt = $('#commentInput').value.trim();
    $('#commentsWrap').innerHTML = `
      <h3>Comments</h3>
      <div class="comment"><b>Aisha Rahman</b> · Just now<br>${txt || 'Good notes.'}</div>`;
    toast('Rating posted. Thanks for the feedback!');
    if ($('#view-myNotes').classList.contains('active')) renderMyNotes(state.activeMyNotesFilter);
  };

  $('#dlBtn').onclick = () => {
    n.downloads = (n.downloads || 0) + 1;
    toast('Downloading file...');
    if ($('#view-myNotes').classList.contains('active')) renderMyNotes(state.activeMyNotesFilter);
  };
}

function createNotesTableHTML(notesArr, isEdit = false, isReview = false) {
  if (!notesArr.length) {
    return `<div class="panel center"><p class="muted">No notes found for this filter.</p></div>`;
  }
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Note</th>
            <th>${isReview ? 'Shared by' : 'Category'}</th>
            <th>${isReview ? 'Category' : 'Status'}</th>
            <th>${isReview ? 'Status' : 'Rating'}</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${notesArr.map(n => `
            <tr>
              <td>${n.title}</td>
              <td>${isReview ? n.by : n.cat}</td>
              <td>${isReview ? n.cat : `<span class="pill ${n.status === 'Live' ? 'live' : 'wait'}">${n.status}</span>`}</td>
              <td>${isReview ? `<span class="pill wait">${n.status}</span>` : `<span class="stars">★★★★★ ${n.rating}</span>`}</td>
              <td class="actions">
                ${isReview ? `
                  <button class="btn" onclick="openNoteModal(${n.id})">OPEN</button>
                  <button class="btn good" onclick="approveNote(${n.id})">APPROVE</button>
                  <button class="btn danger" onclick="rejectNote(${n.id})">REJECT</button>
                ` : `
                  <button class="btn" onclick="openNoteModal(${n.id})">${isEdit ? 'EDIT' : 'OPEN'}</button>
                `}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

function approveNote(id) {
  const n = state.notes.find(x => x.id === id);
  if (n) n.status = 'Live';
  showModal(`
    <div class="modal-head"><h2>✓ Notes Approved</h2></div>
    <p>Note is live in browse now.</p>
    <button class="btn" data-close>CLOSE</button>
  `);
  if ($('#view-admin').classList.contains('active')) renderAdminOverview();
  if ($('#view-review').classList.contains('active')) renderAdminReview(state.activeAdminReviewFilter);
}

function rejectNote(id) {
  const n = state.notes.find(x => x.id === id);
  if (n) n.status = 'Not Approved';
  showModal(`
    <div class="modal-head"><h2>✕ Notes Rejected</h2></div>
    <p>The student has been notified.</p>
    <button class="btn" data-close>CLOSE</button>
  `);
  if ($('#view-admin').classList.contains('active')) renderAdminOverview();
  if ($('#view-review').classList.contains('active')) renderAdminReview(state.activeAdminReviewFilter);
}

function renderHomeCards() {
  $('#homeCards').innerHTML = state.notes.slice(0, 2).map(createNoteCardHTML).join('');
}

function renderBrowse(q = '') {
  let query = q.trim().toLowerCase();
  let filtered = state.notes.filter(n => n.status === 'Live' && (!query || [n.title, n.subject, n.cat, n.desc].join(' ').toLowerCase().includes(query)));
  $('#browseCount').textContent = `${filtered.length} note${filtered.length === 1 ? '' : 's'}${query ? ` matching "${q}"` : ' available'}`;
  $('#browseCards').innerHTML = filtered.length
    ? filtered.map(createNoteCardHTML).join('')
    : `<div class="center"><h2>No result found.</h2><p class="muted">Try a different search term.</p></div>`;
}

function renderMyNotes(filter = 'ALL') {
  state.activeMyNotesFilter = filter;
  const myNotes = state.notes.filter(n => n.by === 'Student');
  const awaitingCount = myNotes.filter(n => n.status === 'Waiting for review').length;
  const totalDownloads = myNotes.reduce((sum, n) => sum + (n.downloads || 0), 0);
  const avgRating = myNotes.length ? (myNotes.reduce((sum, n) => sum + (n.rating || 0), 0) / myNotes.length).toFixed(1) : '0';

  $('#statShared').textContent = myNotes.length;
  $('#statDownloads').textContent = totalDownloads;
  $('#statAvgRating').textContent = avgRating;
  $('#statReview').textContent = awaitingCount;

  const filters = ['ALL', 'LIVE', 'WAITING FOR REVIEW', 'NOT APPROVED'];
  $('#myNotesPills').innerHTML = filters.map(f => `
    <button class="pill ${f === 'LIVE' ? 'live' : f === 'WAITING FOR REVIEW' ? 'wait' : f === 'NOT APPROVED' ? 'no' : ''} ${filter === f ? 'active' : ''}" 
            onclick="renderMyNotes('${f}')">${f}</button>
  `).join('');

  let filteredNotes = myNotes;
  if (filter === 'LIVE') filteredNotes = myNotes.filter(n => n.status === 'Live');
  if (filter === 'WAITING FOR REVIEW') filteredNotes = myNotes.filter(n => n.status === 'Waiting for review');
  if (filter === 'NOT APPROVED') filteredNotes = myNotes.filter(n => n.status === 'Not Approved');

  $('#myNotesTableWrap').innerHTML = createNotesTableHTML(filteredNotes, true);
}

function renderAdminOverview() {
  const queue = state.notes.filter(n => n.status === 'Waiting for review');
  const live = state.notes.filter(n => n.status === 'Live');
  const openReports = state.reports.filter(r => r.status === 'Open').length;
  const totalDownloads = state.notes.reduce((sum, n) => sum + (n.downloads || 0), 0);

  $('#statLive').textContent = live.length;
  $('#statQueue').textContent = queue.length;
  $('#statStudents').textContent = state.students.length;
  $('#statAdminDownloads').textContent = totalDownloads;
  $('#adminNoticeText').textContent = `${queue.length} notes are waiting for review and ${openReports} report${openReports === 1 ? '' : 's'} open`;
  $('#adminOverviewTableWrap').innerHTML = createNotesTableHTML(queue, false, true);
}

function renderAdminReview(filter = 'ALL') {
  state.activeAdminReviewFilter = filter;
  const allNotes = state.notes;
  const waitingCount = allNotes.filter(n => n.status === 'Waiting for review').length;

  const filters = [
    { label: 'ALL', value: 'ALL' },
    { label: 'LIVE', value: 'LIVE' },
    { label: `WAITING FOR REVIEW (${waitingCount})`, value: 'WAITING FOR REVIEW' },
    { label: 'NOT APPROVED', value: 'NOT APPROVED' }
  ];

  $('#adminReviewPills').innerHTML = filters.map(f => `
    <button class="pill ${f.value === 'LIVE' ? 'live' : f.value === 'WAITING FOR REVIEW' ? 'wait' : f.value === 'NOT APPROVED' ? 'no' : ''} ${filter === f.value ? 'active' : ''}" 
            onclick="renderAdminReview('${f.value}')">${f.label}</button>
  `).join('');

  let filteredNotes = allNotes;
  if (filter === 'LIVE') filteredNotes = allNotes.filter(n => n.status === 'Live');
  if (filter === 'WAITING FOR REVIEW') filteredNotes = allNotes.filter(n => n.status === 'Waiting for review');
  if (filter === 'NOT APPROVED') filteredNotes = allNotes.filter(n => n.status === 'Not Approved');

  $('#adminReviewTableWrap').innerHTML = createNotesTableHTML(filteredNotes, false, true);
}

// Global Reports Functions
function renderReports() {
  if (!state.reports.length) {
    $('#reportsTableWrap').innerHTML = `<div class="panel center"><p class="muted">No reports found.</p></div>`;
    return;
  }
  $('#reportsTableWrap').innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Note</th><th>Reported by</th><th>Reason</th><th>Status</th><th>Action</th></tr>
        </thead>
        <tbody>
          ${state.reports.map(r => `
            <tr>
              <td>${r.noteTitle}</td>
              <td>${r.reportedBy}</td>
              <td>${r.reason}</td>
              <td><span class="pill ${r.status === 'Resolved' ? 'live' : r.status === 'Open' ? 'wait' : 'no'}">${r.status}</span></td>
              <td class="actions">
                <button class="btn" onclick="openReportModal(${r.id})">OPEN</button>
                ${r.status === 'Open' ? `
                  <button class="btn good" onclick="resolveReport(${r.id})">RESOLVE</button>
                  <button class="btn danger" onclick="rejectReport(${r.id})">REJECT</button>
                ` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

function openReportModal(id) {
  const r = state.reports.find(x => x.id === id);
  if (!r) return;
  showModal(`
    <div class="modal-head">
      <div>
        <div class="muted">Reports / #${r.id}</div>
        <h2>${r.noteTitle}</h2>
      </div>
      <button class="close" data-close>×</button>
    </div>
    <p><b>Reported by:</b> ${r.reportedBy} · <b>Reason:</b> ${r.reason}</p>
    <p><b>Status:</b> <span class="pill ${r.status === 'Resolved' ? 'live' : r.status === 'Open' ? 'wait' : 'no'}">${r.status}</span></p>
    <div class="panel" style="margin:16px 0;">
      <h3>Report Details</h3>
      <p>${r.desc}</p>
    </div>
    <div class="actions" style="justify-content:flex-end;">
      ${r.status === 'Open' ? `
        <button class="btn good" onclick="resolveReport(${r.id}); closeModal();">RESOLVE</button>
        <button class="btn danger" onclick="rejectReport(${r.id}); closeModal();">REJECT</button>
      ` : ''}
      <button class="btn" data-close>CLOSE</button>
    </div>
  `);
}

function resolveReport(id) {
  const r = state.reports.find(x => x.id === id);
  if (r) r.status = 'Resolved';
  toast('Report marked as resolved');
  renderReports();
  if ($('#view-admin').classList.contains('active')) renderAdminOverview();
}

function rejectReport(id) {
  const r = state.reports.find(x => x.id === id);
  if (r) r.status = 'Rejected';
  toast('Report rejected');
  renderReports();
  if ($('#view-admin').classList.contains('active')) renderAdminOverview();
}

function renderStudents(q = '') {
  let filtered = state.students.filter(s => s.join(' ').toLowerCase().includes(q.toLowerCase()));
  $('#studentsTableWrap').innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Student</th><th>Course</th><th>Notes</th><th>Status</th><th>Action</th></tr>
        </thead>
        <tbody>
          ${filtered.map(s => `
            <tr>
              <td><b>${s[0]}</b><br><span class="muted">${s[1]}</span></td>
              <td>${s[2]}</td>
              <td>${s[3]}</td>
              <td><span class="pill ${s[4] === 'Active' ? 'live' : 'wait'}">${s[4]}</span></td>
              <td class="actions">
                <button class="btn" onclick="toast('Viewing student...')">VIEW</button>
                <button class="btn ${s[4] === 'Active' ? 'warn' : 'good'}" onclick="toggleStudentStatus('${s[1]}')">${s[4] === 'Active' ? 'SUSPEND' : 'APPROVE'}</button>
                <button class="btn danger" onclick="deleteStudentModal('${s[1]}')">DELETE</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

function toggleStudentStatus(email) {
  let s = state.students.find(x => x[1] === email);
  if (s) {
    s[4] = s[4] === 'Active' ? 'Suspended' : 'Active';
    renderStudents($('#studentSearchInput')?.value || '');
  }
}

function deleteStudentModal(email) {
  let s = state.students.find(x => x[1] === email);
  if (!s) return;
  showModal(`
    <div class="modal-head"><h2>⚠ Delete ${s[0]}?</h2></div>
    <p>This removes the account and its ${s[3]} notes. It cannot be undone.</p>
    <div class="actions">
      <button class="btn" data-close>KEEP IT</button>
      <button class="btn danger" id="confirmDeleteBtn">DELETE</button>
    </div>
  `);
  $('#confirmDeleteBtn').onclick = () => {
    state.students = state.students.filter(x => x[1] !== email);
    closeModal();
    toast('Account deleted.');
    renderStudents($('#studentSearchInput')?.value || '');
  };
}

// Bind all handlers to Window for global HTML event access
window.navigateTo = navigateTo;
window.signOut = signOut;
window.openNoteModal = openNoteModal;
window.approveNote = approveNote;
window.rejectNote = rejectNote;
window.renderMyNotes = renderMyNotes;
window.renderAdminReview = renderAdminReview;
window.renderReports = renderReports;
window.openReportModal = openReportModal;
window.resolveReport = resolveReport;
window.rejectReport = rejectReport;
window.toggleStudentStatus = toggleStudentStatus;
window.deleteStudentModal = deleteStudentModal;
window.toast = toast;
window.closeModal = closeModal;

$('#studentLoginForm').onsubmit = e => {
  e.preventDefault();
  state.role = 'student';
  state.user = 'Student';
  updateHeader();
  navigateTo('home');
};

$('#adminLoginForm').onsubmit = e => {
  e.preventDefault();
  state.role = 'admin';
  state.user = 'Administrator';
  updateHeader();
  navigateTo('admin');
};

$('#registerForm').onsubmit = e => {
  e.preventDefault();
  toast('Account created');
  navigateTo('studentLogin');
};

$('#uploadForm').onsubmit = e => {
  e.preventDefault();
  state.notes.unshift({
    id: Date.now(),
    cat: $('#uploadCategory').value,
    subject: $('#uploadSubject').value,
    title: $('#uploadTitle').value,
    desc: $('#uploadDesc').value,
    by: 'Student',
    rating: 0,
    downloads: 0,
    status: 'Waiting for review',
    file: $('#uploadFile').files[0]
  });
  toast('Notes uploaded — waiting for review');
  navigateTo('myNotes');
};

$('#profileForm').onsubmit = e => { e.preventDefault(); toast('Profile saved'); };
$('#passForm').onsubmit = e => { e.preventDefault(); toast('Password changed'); e.target.reset(); };

$('#searchBtn').onclick = () => navigateTo('browse', $('#globalSearch').value);
$('#globalSearch').onkeydown = e => { if (e.key === 'Enter') navigateTo('browse', e.target.value); };
$('#studentSearchInput').oninput = e => renderStudents(e.target.value);

chatFab.onclick = () => {
  if (!state.user) {
    showModal(`
      <div class="modal-head">
        <div><h2>Contact Support</h2><div class="muted">Having trouble accessing ARMS? Send us a request.</div></div>
        <button class="close" data-close>×</button>
      </div>
      <form id="guestSupportForm" class="form">
        <label>Your Name *<input name="name" required placeholder="Enter your name"></label>
        <label>Your Email *<input name="email" type="email" required placeholder="Enter your email"></label>
        <label>Message *<textarea name="message" maxlength="600" required placeholder="Tell us what happened"></textarea></label>
        <button class="btn primary">Submit request</button>
      </form>
    `);
    $('#guestSupportForm').onsubmit = e => {
      e.preventDefault();
      closeModal();
      toast('Support request submitted');
    };
  } else {
    showModal(`
      <div class="modal-head">
        <div><h2>ARMS Support</h2><div class="muted">Usually replies within a day</div></div>
        <button class="close" data-close>×</button>
      </div>
      <div class="support-messages">
        <div class="chat-empty"><strong>How can we help you?</strong><p>Send a message to start a conversation.</p></div>
      </div>
      <form id="chatForm" class="form">
        <label>Message<textarea required placeholder="Write a message..."></textarea></label>
        <button class="btn primary">Send message</button>
      </form>
    `);
    $('#chatForm').onsubmit = e => {
      e.preventDefault();
      toast('Message sent');
      closeModal();
    };
  }
};

navigateTo('role');