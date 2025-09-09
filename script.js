let currentPage = 1;
const limit = 5;

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
  const payload = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    resume_link: document.getElementById("resume_link").value,
    query: document.getElementById("query").value
  };
  const res = await fetch("/api/submitResume", { method: "POST", headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  const data = await res.json();
  if (data.success) { 
    alert("Submitted successfully!"); 
    document.getElementById("resumeForm").reset(); 
  } else alert("Error: "+data.error);
});

// ----------------------
// Admin login
// ----------------------
document.getElementById("adminLogin").addEventListener("submit", async e => {
  e.preventDefault();
  const username = document.getElementById("adminUser").value;
  const password = document.getElementById("adminPass").value;
  const res = await fetch("/api/admin", { method:"POST", headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'login', username, password }) });
  const data = await res.json();
  if (data.success) { hideAll(); document.getElementById("adminPanel").style.display="block"; loadResumes(); }
  else alert("Invalid credentials");
});

// ----------------------
// Load resumes (admin) with loader
// ----------------------
async function loadResumes(page=1){
  const tbody = document.getElementById("resumeTableBody");
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>`;
  
  const res = await fetch("/api/admin", { method:"POST", headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'getResumes', page, limit }) });
  const data = await res.json();
  
  displayResumes(data.resumes || []);
  document.getElementById("pageInfo").innerText=`Page ${page}`;
  currentPage = page;
}

function displayResumes(resumes){
  const tbody = document.getElementById("resumeTableBody");
  tbody.innerHTML="";
  resumes.forEach(r=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${r.name}</td>
      <td>${r.email}</td>
      <td><a href="${r.resume_link}" target="_blank">View Resume</a></td>
      <td>${r.query || '-'}</td>
      <td>${r.status}</td>
      <td>
        ${r.status==='pending'?`<button onclick="toggleStatus(${r.id},'complete',this)">✅ Complete</button>`:`<button onclick="toggleStatus(${r.id},'pending',this)">🔄 Undo</button>`}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ----------------------
// Toggle status without reloading
// ----------------------
async function toggleStatus(id, status, btn){
  const oldText = btn.innerText;
  btn.innerText = '⏳';
  btn.disabled = true;

  try {
    const res = await fetch("/api/admin", { method:"POST", headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'updateStatus', id, status }) });
    const data = await res.json();
    if (data.success){
      btn.innerText = status==='complete' ? '🔄 Undo' : '✅ Complete';
      btn.setAttribute('onclick', `toggleStatus(${id},'${status==='complete'?'pending':'complete'}',this)`);
    } else {
      alert("Failed to update");
      btn.innerText = oldText;
    }
  } catch (e) {
    alert("Error: "+e.message);
    btn.innerText = oldText;
  }
  btn.disabled = false;
}

// ----------------------
// Pagination
// ----------------------
document.getElementById("prevBtn").addEventListener("click",()=>{ if(currentPage>1) loadResumes(currentPage-1); });
document.getElementById("nextBtn").addEventListener("click",()=>{ loadResumes(currentPage+1); });
