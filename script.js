let currentPage = 1;
const limit = 5;

// ----------------------
// Loader
// ----------------------
const adminLoader = document.createElement('div');
adminLoader.id = 'adminLoader';
adminLoader.innerText = 'Loading...';
adminLoader.style.display = 'none';
adminLoader.style.fontWeight = 'bold';
adminLoader.style.marginBottom = '10px';
document.getElementById("adminPanel").prepend(adminLoader);

const userLoader = document.createElement('div');
userLoader.id = 'userLoader';
userLoader.innerText = 'Submitting...';
userLoader.style.display = 'none';
userLoader.style.fontWeight = 'bold';
userLoader.style.marginBottom = '10px';
document.getElementById("userPage").prepend(userLoader);

function showLoader(loader) { loader.style.display = 'block'; }
function hideLoader(loader) { loader.style.display = 'none'; }

// ----------------------
// Navigation
// ----------------------
document.getElementById("userBtn").addEventListener("click", () => { hideAll(); document.getElementById("userPage").style.display = "block"; });
document.getElementById("adminBtn").addEventListener("click", () => { hideAll(); document.getElementById("adminLoginPage").style.display = "block"; });

function hideAll() {
  document.getElementById("landing").style.display = "none";
  document.getElementById("userPage").style.display = "none";
  document.getElementById("adminLoginPage").style.display = "none";
  document.getElementById("adminPanel").style.display = "none";
}
function backToLanding() { hideAll(); document.getElementById("landing").style.display = "block"; }
function logoutAdmin() { hideAll(); document.getElementById("landing").style.display = "block"; }

// ----------------------
// User submit
// ----------------------
document.getElementById("resumeForm").addEventListener("submit", async e => {
  e.preventDefault();
  const submitBtn = e.target.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  showLoader(userLoader);

  const payload = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    resume_link: document.getElementById("resume_link").value,
    query: document.getElementById("query").value
  };

  try {
    const res = await fetch("/api/submitResume", { 
      method: "POST", 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify(payload) 
    });
    const data = await res.json();

    if (data.success) {
      alert("Submitted successfully!");
      document.getElementById("resumeForm").reset();
    } else {
      alert("Error: " + data.error);
    }
  } catch(err) {
    alert("Failed to submit. Try again.");
    console.error(err);
  } finally {
    hideLoader(userLoader);
    submitBtn.disabled = false;
  }
});

// ----------------------
// Admin login
// ----------------------
document.getElementById("adminLogin").addEventListener("submit", async e => {
  e.preventDefault();
  const username = document.getElementById("adminUser").value;
  const password = document.getElementById("adminPass").value;
  const res = await fetch("/api/admin", { 
    method:"POST", 
    headers:{'Content-Type':'application/json'}, 
    body: JSON.stringify({ action:'login', username, password }) 
  });
  const data = await res.json();
  if (data.success) { 
    hideAll(); 
    document.getElementById("adminPanel").style.display="block"; 
    loadResumes(); 
  } else {
    alert("Invalid credentials");
  }
});

// ----------------------
// Load resumes (admin) with loader
// ----------------------
async function loadResumes(page=1){
  showLoader(adminLoader);
  try {
    const res = await fetch("/api/admin", { 
      method:"POST", 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify({ action:'getResumes', page, limit }) 
    });
    const data = await res.json();
    displayResumes(data.resumes);
    document.getElementById("pageInfo").innerText=`Page ${page}`;
    currentPage=page;
  } catch(err) {
    alert("Failed to load resumes");
    console.error(err);
  } finally {
    hideLoader(adminLoader);
  }
}

// ----------------------
// Display resumes
// ----------------------
function displayResumes(resumes){
  const tbody = document.getElementById("resumeTableBody");
  tbody.innerHTML="";
  resumes.forEach(r=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${r.name}</td>
      <td>${r.email}</td>
      <td><a href="${r.resume_link}" target="_blank">View Resume</a></td>
      <td>${r.status}</td>
      <td>
        ${r.status==='pending' 
          ? `<button onclick="updateStatus(${r.id},'complete')">✅ Complete</button>` 
          : `<button onclick="updateStatus(${r.id},'pending')">🔄 Undo</button>`}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ----------------------
// Update status (Complete / Undo) with optimistic UI
// ----------------------
async function updateStatus(id, newStatus){
  const row = document.querySelector(`#resumeTableBody tr td button[onclick*="${id}"]`)?.parentElement.parentElement;
  if(!row) return;

  const statusCell = row.children[3];
  const button = row.querySelector('button');

  const oldStatus = statusCell.innerText;

  // Optimistic update
  statusCell.innerText = newStatus;
  button.innerText = newStatus === 'pending' ? '✅ Complete' : '🔄 Undo';
  button.disabled = true;
  showLoader(adminLoader);

  try {
    const res = await fetch("/api/admin", { 
      method:"POST", 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify({ action:'updateStatus', id, status:newStatus }) 
    });
    const data = await res.json();
    if(!data.success) throw new Error('Update failed');
  } catch (err) {
    // Revert on failure
    statusCell.innerText = oldStatus;
    button.innerText = oldStatus === 'pending' ? '✅ Complete' : '🔄 Undo';
    alert('Failed to update status. Try again.');
    console.error(err);
  } finally {
    button.disabled = false;
    hideLoader(adminLoader);
  }
}

// ----------------------
// Pagination
// ----------------------
document.getElementById("prevBtn").addEventListener("click",()=>{ if(currentPage>1) loadResumes(currentPage-1); });
document.getElementById("nextBtn").addEventListener("click",()=>{ loadResumes(currentPage+1); });
