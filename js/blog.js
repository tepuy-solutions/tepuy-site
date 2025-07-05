/* ===== like button (localStorage) ===== */
document.addEventListener("DOMContentLoaded", ()=>{
  const likeBtn  = document.getElementById("like-btn");
  if(!likeBtn) return;                                   // only on post pages
  const key = "likes-"+location.pathname;
  const span= document.getElementById("like-count");
  span.textContent = localStorage.getItem(key) || 0;

  likeBtn.addEventListener("click",()=>{
    let n = parseInt(localStorage.getItem(key) || 0,10)+1;
    localStorage.setItem(key,n);
    span.textContent = n;
  });
});

/* ===== estimate read-time ===== */
window.addEventListener("load",()=>{
  const body = document.querySelector(".post-body");
  const rt   = document.getElementById("read-time");
  if(body && rt){
    const words = body.innerText.trim().split(/\s+/).length;
    rt.textContent = Math.max(1,Math.round(words/200))+" min read";
  }
});

/* ===== share buttons ===== */
document.querySelectorAll(".share-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const url = encodeURIComponent(location.href);
    const title = encodeURIComponent(document.title);
    let shareURL="";
    switch(btn.dataset.net){
      case "twitter":  shareURL=`https://twitter.com/intent/tweet?url=${url}&text=${title}`;break;
      case "linkedin": shareURL=`https://www.linkedin.com/sharing/share-offsite/?url=${url}`;break;
      case "facebook": shareURL=`https://www.facebook.com/sharer/sharer.php?u=${url}`;break;
    }
    window.open(shareURL,"_blank","noopener");
  });
});

/* ===== rudimentary comments (localStorage) ===== */
const form = document.getElementById("comment-form");
if(form){
  const list = document.getElementById("comment-list");
  const key  = "comments-"+location.pathname;
  const existing = JSON.parse(localStorage.getItem(key)||"[]");
  existing.forEach(addLi);

  form.addEventListener("submit",e=>{
    e.preventDefault();
    const name = document.getElementById("comment-name").value.trim();
    const text = document.getElementById("comment-text").value.trim();
    if(!name||!text) return;
    const comment = {name,text,date:new Date().toLocaleDateString()};
    addLi(comment);
    existing.push(comment);
    localStorage.setItem(key,JSON.stringify(existing));
    form.reset();
  });

  function addLi({name,text,date}){
    const li = document.createElement("li");
    li.innerHTML=`<strong>${name}</strong> • <em>${date}</em><br>${text}`;
    list.appendChild(li);
  }
}
