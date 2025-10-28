// admin/admin.js
const API_BASE = window.API_BASE || (location.origin + "/api/admin");

async function api(path, opts={}) {
  const res = await fetch(API_BASE + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers||{}) },
    ...opts
  });
  if (res.status === 403) {
    alert("Access denied: admin only");
    window.location.href = "/"; // or /login
    return Promise.reject(new Error("Forbidden"));
  }
  if (!res.ok) throw new Error(`API ${path} failed`);
  return res.json();
}

function setActive(id){ 
  document.querySelectorAll(".nav a").forEach(a=>a.classList.remove("active")); 
  const el=document.getElementById(id); 
  if(el) el.classList.add("active"); 
}
