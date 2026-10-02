// ========== 全局状态 ==========
let currentCat='all', currentSort='hot', currentTab='home', expandedId=null;
let favs=new Set(JSON.parse(localStorage.getItem('wz_favs')||'[]'));

// ========== 初始化 ==========
function init(){
  renderCats();
  renderList();
  updateStats();
  checkUpdate();
}

function checkUpdate(){
  let today=new Date().toISOString().slice(0,10);
  let badge=document.getElementById('update-badge');
  if(DB.lastUpdate===today){
    badge.textContent='✅ 今日已更新';
    badge.style.background='#4caf50';
    badge.style.color='#fff';
  } else {
    badge.textContent='🔄 等待今日更新';
    badge.style.background='#ff9800';
    badge.style.color='#000';
  }
}

function updateStats(){
  document.getElementById('stat-total').textContent=DB.projects.length;
  let today=new Date().toISOString().slice(0,10);
  let todayUpdate=DB.updates.find(u=>u.date===today);
  document.getElementById('stat-new').textContent=todayUpdate?todayUpdate.added:0;
  document.getElementById('stat-fav').textContent=favs.size;
}

// ========== 分类 ==========
function getCats(){
  let cats=['all'];
  DB.projects.forEach(p=>{if(!cats.includes(p.cat))cats.push(p.cat);});
  return cats;
}

function catLabel(c){
  if(c==='all') return '🌐 全部';
  const icons={'任务悬赏':'📋','问卷调查':'📝','APP拉新':'📱','自媒体':'🎬','AI副业':'🤖','电商':'🛒','技能服务':'💼','其他':'📦'};
  return (icons[c]||'📌')+' '+c;
}

function renderCats(){
  let div=document.getElementById('cats');
  div.innerHTML='';
  getCats().forEach(c=>{
    let el=document.createElement('span');
    el.className='cat'+(c===currentCat?' active':'');
    el.textContent=catLabel(c);
    el.onclick=()=>{currentCat=c;renderCats();renderList();};
    div.appendChild(el);
  });
}

// ========== 排序 ==========
function setSort(s,btn){
  currentSort=s;
  document.querySelectorAll('.sort-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderList();
}

// ========== 渲染列表 ==========
function getFiltered(){
  let q=document.getElementById('search-input').value.trim().toLowerCase();
  let list=DB.projects;
  if(currentTab==='fav') list=list.filter(p=>favs.has(p.id));
  if(currentCat!=='all') list=list.filter(p=>p.cat===currentCat);
  if(q) list=list.filter(p=>
    p.name.toLowerCase().includes(q)||
    p.desc.toLowerCase().includes(q)||
    p.cat.toLowerCase().includes(q)||
    p.source.toLowerCase().includes(q)||
    p.tags.some(t=>t.toLowerCase().includes(q))
  );
  // 排序
  if(currentSort==='hot') list.sort((a,b)=>b.hot-a.hot);
  else if(currentSort==='id') list.sort((a,b)=>b.id-a.id);
  else if(currentSort==='difficulty') list.sort((a,b)=>a.difficulty-b.difficulty);
  return list;
}

function hotColor(h){
  if(h>=90) return '#ff1744';
  if(h>=80) return '#ff5722';
  if(h>=70) return '#ff9800';
  return '#9e9e9e';
}

function difficultyStars(d){
  return '⭐'.repeat(d)+'☆'.repeat(4-d);
}

function renderList(){
  let list=getFiltered();
  let div=document.getElementById('projects');
  if(list.length===0){
    div.innerHTML=`<div class="empty"><div class="emoji">🔍</div><div>${currentTab==='fav'?'还没有收藏项目':'没有找到匹配的项目'}</div></div>`;
    return;
  }
  div.innerHTML='';
  list.forEach(p=>{
    let card=document.createElement('div');
    card.className='card'+(expandedId===p.id?' expanded':'');
    card.id='card-'+p.id;
    let favActive=favs.has(p.id)?' active':'';
    let favIcon=favs.has(p.id)?'⭐':'☆';
    card.innerHTML=`
      <div class="card-header" onclick="toggleExpand(${p.id})">
        <div class="card-title">${p.name}</div>
        <div style="display:flex;align-items:flex-start">
          <div class="card-hot"><span class="hot-num" style="color:${hotColor(p.hot)}">${p.hot}</span><span class="hot-label">热度</span></div>
          <button class="fav-btn${favActive}" onclick="event.stopPropagation();toggleFav(${p.id})">${favIcon}</button>
        </div>
      </div>
      <div class="card-meta" onclick="toggleExpand(${p.id})">
        <span class="meta-item income">💰 ${p.income}</span>
        <span class="meta-item cost">💸 ${p.cost}</span>
        <span class="meta-item">🕐 ${p.time}</span>
        <span class="meta-item">📂 ${p.cat}</span>
      </div>
      <div class="card-desc">${p.desc}</div>
      <div class="card-tags">${p.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>
      <div class="card-detail">
        <div class="detail-section">
          <div class="detail-title">📋 上手难度</div>
          <div class="detail-content">${difficultyStars(p.difficulty)} ${['非常简单','简单','中等','较高'][p.difficulty-1]||'简单'}</div>
        </div>
        <div class="detail-section">
          <div class="detail-title">🔧 操作步骤</div>
          <div class="detail-steps">${p.steps}</div>
        </div>
        <div class="detail-section">
          <div class="detail-title">💡 实操建议</div>
          <ul class="detail-tips">${p.tips.map(t=>`<li>✅ ${t}</li>`).join('')}</ul>
        </div>
        <div class="detail-source">📌 来源: ${p.source} | 收录: ${DB.lastUpdate}</div>
      </div>`;
    div.appendChild(card);
  });
}

// ========== 展开/收起 ==========
function toggleExpand(id){
  expandedId=expandedId===id?null:id;
  renderList();
  if(expandedId){
    let el=document.getElementById('card-'+id);
    if(el) setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'nearest'}),100);
  }
}

// ========== 收藏 ==========
function toggleFav(id){
  if(favs.has(id)) favs.delete(id); else favs.add(id);
  localStorage.setItem('wz_favs',JSON.stringify([...favs]));
  updateStats();
  renderList();
}

// ========== Tab切换 ==========
function switchTab(tab,el){
  currentTab=tab;
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  el.classList.add('active');
  if(tab==='log'){showLog();return;}
  expandedId=null;
  currentCat='all';
  document.getElementById('search-input').value='';
  renderCats();
  renderList();
}

// ========== 更新日志 ==========
function showLog(){
  let modal=document.getElementById('log-modal');
  modal.classList.add('show');
  let list=document.getElementById('log-list');
  let logs=[...DB.updates].reverse();
  list.innerHTML=logs.map(u=>`
    <div style="background:#0d0d15;border-radius:12px;padding:14px;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span style="color:#00d2ff;font-weight:600">${u.date}</span>
        <span style="color:#4caf50;font-size:12px">+${u.added} 新增</span>
      </div>
      <div style="color:#aaa;font-size:13px">${u.action}</div>
    </div>`).join('');
}

function closeLog(e){
  if(!e||e.target.classList.contains('modal-overlay')||e.target.classList.contains('modal-close')){
    document.getElementById('log-modal').classList.remove('show');
  }
}

// ========== 启动 ==========
init();