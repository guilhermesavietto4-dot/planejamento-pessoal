const KEY="planejamento_pro_v1";
const areas=["profissional","pessoal","estudos","saude","financeiro"];
const areaNames={profissional:"Profissional",pessoal:"Pessoal",estudos:"Estudos",saude:"Saúde",financeiro:"Financeiro"};
const areaClass={profissional:"blue",pessoal:"orange",estudos:"purple",saude:"green",financeiro:"cyan"};

function localISO(date=new Date()){
  const off=date.getTimezoneOffset()*60000;
  return new Date(date-off).toISOString().slice(0,10);
}
function plusDays(n){const d=new Date();d.setDate(d.getDate()+n);return localISO(d)}
function uid(){return crypto.randomUUID()}
const seed={
  tasks:[
    {id:uid(),title:"Finalizar relatório do projeto",date:localISO(),time:"09:00",area:"profissional",priority:"alta",done:false,projectId:"p1"},
    {id:uid(),title:"Estudar 1h de inglês",date:localISO(),time:"14:00",area:"estudos",priority:"media",done:false,projectId:"p2"},
    {id:uid(),title:"Treino na academia",date:localISO(),time:"18:00",area:"saude",priority:"media",done:false,projectId:""},
    {id:uid(),title:"Ler 20 páginas",date:localISO(),time:"20:00",area:"pessoal",priority:"baixa",done:false,projectId:""},
    {id:uid(),title:"Reunião com cliente",date:plusDays(1),time:"10:00",area:"profissional",priority:"alta",done:false,projectId:"p1"},
    {id:uid(),title:"Planejar conteúdo da semana",date:plusDays(1),time:"16:00",area:"profissional",priority:"media",done:false,projectId:"p1"},
    {id:uid(),title:"Organizar finanças pessoais",date:plusDays(2),time:"19:00",area:"financeiro",priority:"media",done:false,projectId:""},
    {id:uid(),title:"Revisar metas do mês",date:plusDays(3),time:"20:30",area:"pessoal",priority:"baixa",done:false,projectId:""}
  ],
  projects:[
    {id:"p1",title:"Lançamento do novo site",area:"profissional",progress:76,deadline:plusDays(35)},
    {id:"p2",title:"Evolução no inglês",area:"estudos",progress:45,deadline:plusDays(90)},
    {id:"p3",title:"Organização pessoal",area:"pessoal",progress:60,deadline:plusDays(50)}
  ],
  goals:[
    {id:uid(),title:"Ler 12 livros este ano",progress:75,deadline:plusDays(150)},
    {id:uid(),title:"Economizar R$ 10.000",progress:60,deadline:plusDays(180)},
    {id:uid(),title:"Correr 5 km em 30 min",progress:40,deadline:plusDays(100)},
    {id:uid(),title:"Aprender programação",progress:30,deadline:plusDays(210)}
  ],
  habits:[
    {id:uid(),title:"Beber 2L de água",history:{}},
    {id:uid(),title:"Meditar 10 minutos",history:{}},
    {id:uid(),title:"Exercitar-se",history:{}},
    {id:uid(),title:"Ler todos os dias",history:{}},
    {id:uid(),title:"Dormir 7–8h",history:{}}
  ],
  notes:"Ideias para o projeto\n- Relatórios personalizados\n- Melhorar experiência do calendário\n\nLembrete\nRenovar plano de internet até o fim do mês.",
  weekly:{tarefas:[62,78,72,82,76,88,84],habitos:[42,60,54,61,57,72,74],metas:[18,24,20,23,17,29,49],foco:[25,44,39,48,45,56,64]}
};
let data=load(),taskFilter="todas",calendarCursor=new Date(),selectedDate=localISO();

function load(){try{const v=JSON.parse(localStorage.getItem(KEY));return v||structuredClone(seed)}catch{return structuredClone(seed)}}
function save(){localStorage.setItem(KEY,JSON.stringify(data));renderAll()}
function esc(s=""){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function fmtDate(iso,opt={day:"2-digit",month:"short"}){if(!iso)return"—";const[y,m,d]=iso.split("-").map(Number);return new Intl.DateTimeFormat("pt-BR",opt).format(new Date(y,m-1,d))}
function avg(arr){return arr.length?Math.round(arr.reduce((a,b)=>a+b,0)/arr.length):0}

function switchPage(id){
  document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===id));
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.page===id));
  const btn=document.querySelector(`[data-page="${id}"] span`);
  document.getElementById("pageTitle").textContent=btn?btn.textContent:id[0].toUpperCase()+id.slice(1);
  document.getElementById("sidebar").classList.remove("open");
  window.scrollTo({top:0,behavior:"smooth"});
}

function dateLabels(){
  const now=new Date();
  document.getElementById("dateLabel").textContent=new Intl.DateTimeFormat("pt-BR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"}).format(now);
  document.getElementById("monthLabel").textContent=new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric"}).format(now);
}

function achievement(){
  const result={};
  for(const a of areas){
    const items=data.tasks.filter(t=>t.area===a);
    result[a]=items.length?Math.round(items.filter(t=>t.done).length/items.length*100):0;
  }
  return result;
}

function focusScore(){
  const today=data.tasks.filter(t=>t.date===localISO());
  const t=today.length?today.filter(x=>x.done).length/today.length*100:0;
  const h=data.habits.length?data.habits.filter(h=>h.history?.[localISO()]).length/data.habits.length*100:0;
  const g=data.goals.length?avg(data.goals.map(g=>+g.progress||0)):0;
  return Math.round(t*.45+h*.30+g*.25);
}

function metricHTML(title,value,sub,pct){
  return `<article class="metric-card"><small>${title}</small><strong>${value}</strong><span>${sub}</span><div class="metric-progress"><i style="width:${Math.max(0,Math.min(100,pct))}%"></i></div></article>`
}
function renderMetrics(){
  const today=data.tasks.filter(t=>t.date===localISO());
  const done=today.filter(t=>t.done).length;
  const habitsDone=data.habits.filter(h=>h.history?.[localISO()]).length;
  const goalsActive=data.goals.filter(g=>+g.progress<100).length;
  const score=focusScore();
  document.getElementById("focusScore").textContent=score+"%";
  const html=[
    metricHTML("Tarefas de hoje",today.length,"planejadas",today.length?done/today.length*100:0),
    metricHTML("Concluídas hoje",done,`de ${today.length}`,today.length?done/today.length*100:0),
    metricHTML("Metas ativas",goalsActive,"em andamento",avg(data.goals.map(g=>+g.progress||0))),
    metricHTML("Hábitos",habitsDone+"/"+data.habits.length,"concluídos hoje",data.habits.length?habitsDone/data.habits.length*100:0),
    metricHTML("Foco do dia",score+"%","produtividade",score)
  ].join("");
  document.getElementById("metrics").innerHTML=html;
  document.getElementById("performanceMetrics").innerHTML=html;
}

function renderAreas(){
  const a=achievement();
  const html=areas.map(k=>`<div class="area-row"><label><span class="dot ${k==="profissional"?"work":k==="pessoal"?"personal":k==="estudos"?"study":k==="saude"?"health":"finance"}"></span>${areaNames[k]}</label><div class="bar ${areaClass[k]}"><i style="width:${a[k]}%"></i></div><span>${a[k]}%</span></div>`).join("");
  document.getElementById("areaAchievement").innerHTML=html;
  document.getElementById("performanceAreas").innerHTML=html;
}

function drawLineChart(canvasId){
  const c=document.getElementById(canvasId); if(!c)return;
  const dpr=window.devicePixelRatio||1,rect=c.getBoundingClientRect(),w=Math.max(500,rect.width),h=Math.max(220,rect.height);
  c.width=w*dpr;c.height=h*dpr;
  const ctx=c.getContext("2d");ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);
  const pad={l:30,r:18,t:15,b:30},cw=w-pad.l-pad.r,ch=h-pad.t-pad.b;
  ctx.strokeStyle="#e7ebf1";ctx.lineWidth=1;ctx.font="9px Inter";ctx.fillStyle="#8b95a5";
  [0,25,50,75,100].forEach(v=>{const y=pad.t+ch-(v/100)*ch;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();ctx.fillText(v+"%",2,y+3)});
  const days=["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
  days.forEach((x,i)=>{const px=pad.l+(cw/6)*i;ctx.fillText(x,px-8,h-8)});
  const series=[["tarefas","#2563eb"],["habitos","#16a36a"],["metas","#8b5cf6"],["foco","#f97316"]];
  series.forEach(([key,color])=>{
    const arr=data.weekly[key]||[];
    ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();
    arr.forEach((v,i)=>{const x=pad.l+(cw/6)*i,y=pad.t+ch-(v/100)*ch;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});
    ctx.stroke();
    arr.forEach((v,i)=>{const x=pad.l+(cw/6)*i,y=pad.t+ch-(v/100)*ch;ctx.fillStyle="#fff";ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();ctx.stroke()});
  });
}
function taskRow(t,compact=false){
  return `<div class="task ${t.done?"done":""}">
    <button class="check ${t.done?"done":""}" data-toggle-task="${t.id}">${t.done?"✓":""}</button>
    <div class="task-body"><div class="task-title">${esc(t.title)}</div><div class="task-meta"><span class="tag ${t.area}">${areaNames[t.area]}</span><span>${fmtDate(t.date)}</span></div></div>
    <span class="time">${t.time||""}</span>
    ${compact?"":`<button class="delete" data-delete-task="${t.id}">✕</button>`}
  </div>`;
}
function renderTasks(){
  let arr=[...data.tasks].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  if(taskFilter==="pendentes")arr=arr.filter(t=>!t.done);
  if(taskFilter==="concluidas")arr=arr.filter(t=>t.done);
  document.getElementById("taskList").innerHTML=arr.length?arr.map(t=>taskRow(t)).join(""):`<div class="empty">Nenhuma tarefa.</div>`;
  const today=data.tasks.filter(t=>t.date===localISO()).sort((a,b)=>(a.time||"").localeCompare(b.time||""));
  document.getElementById("todayTaskList").innerHTML=today.length?today.slice(0,6).map(t=>taskRow(t,true)).join(""):`<div class="empty">Nada planejado para hoje.</div>`;
}

function goalRow(g,full=false){
  return `<div class="goal-row"><div class="goal-top"><strong>${esc(g.title)}</strong><span>${g.progress}%</span></div><div class="goal-progress"><i style="width:${g.progress}%"></i></div>${full?`<div class="project-card actions"><input type="number" min="0" max="100" value="${g.progress}" data-goal-progress="${g.id}"><button class="delete" data-delete-goal="${g.id}">Excluir</button></div>`:""}</div>`;
}
function renderGoals(){
  document.getElementById("goalPreview").innerHTML=data.goals.length?data.goals.slice(0,5).map(g=>goalRow(g)).join(""):`<div class="empty">Nenhuma meta.</div>`;
  document.getElementById("goalGrid").innerHTML=data.goals.length?data.goals.map(g=>`<article class="project-card"><h4>${esc(g.title)}</h4><p>Prazo: ${fmtDate(g.deadline,{day:"2-digit",month:"long",year:"numeric"})}</p><div class="goal-progress"><i style="width:${g.progress}%"></i></div><div class="actions"><input type="number" min="0" max="100" value="${g.progress}" data-goal-progress="${g.id}"><button class="delete" data-delete-goal="${g.id}">Excluir</button></div></article>`).join(""):`<div class="empty">Nenhuma meta.</div>`;
}

function renderHabits(){
  const today=localISO();
  const row=h=>`<div class="habit-row"><strong>${esc(h.title)}</strong><button class="habit-toggle ${h.history?.[today]?"done":""}" data-toggle-habit="${h.id}">${h.history?.[today]?"Feito ✓":"Marcar hoje"}</button><button class="delete" data-delete-habit="${h.id}">✕</button></div>`;
  document.getElementById("habitPreview").innerHTML=data.habits.length?data.habits.slice(0,5).map(row).join(""):`<div class="empty">Nenhum hábito.</div>`;
  document.getElementById("habitList").innerHTML=data.habits.length?data.habits.map(row).join(""):`<div class="empty">Nenhum hábito.</div>`;
}

function renderProjects(){
  const card=p=>`<article class="project-card"><h4>${esc(p.title)}</h4><p>${areaNames[p.area]} • prazo ${fmtDate(p.deadline)}</p><div class="goal-progress"><i style="width:${p.progress}%"></i></div><div class="actions"><span>${p.progress}%</span><button class="delete" data-delete-project="${p.id}">Excluir</button></div></article>`;
  document.getElementById("projectPreview").innerHTML=data.projects.length?data.projects.slice(0,4).map(card).join(""):`<div class="empty">Nenhum projeto.</div>`;
  document.getElementById("projectGrid").innerHTML=data.projects.length?data.projects.map(card).join(""):`<div class="empty">Nenhum projeto.</div>`;
  const sel=document.getElementById("taskProject"),current=sel.value;
  sel.innerHTML=`<option value="">Sem projeto</option>`+data.projects.map(p=>`<option value="${p.id}">${esc(p.title)}</option>`).join("");
  sel.value=current;
}

function renderNotes(){
  const t=document.getElementById("notes"); if(t.value!==data.notes)t.value=data.notes||"";
  document.getElementById("noteCount").textContent=t.value.length+" caracteres";
  const chunks=(data.notes||"").split(/\n\s*\n/).filter(Boolean).slice(0,4);
  document.getElementById("notePreview").innerHTML=chunks.length?chunks.map(x=>`<div class="note-tile">${esc(x.slice(0,100))}</div>`).join(""):`<div class="empty">Sem notas ainda.</div>`;
}

function buildCalendar(containerId,date,full=false){
  const c=document.getElementById(containerId); if(!c)return;
  const y=date.getFullYear(),m=date.getMonth(),first=new Date(y,m,1);
  const start=(first.getDay()+6)%7;
  const total=full?42:35;
  const names=["SEG","TER","QUA","QUI","SEX","SÁB","DOM"];
  let html=names.map(n=>`<div class="${full?"full-cal-head":"cal-head"}">${n}</div>`).join("");

  for(let i=0;i<total;i++){
    const d=new Date(y,m,1-start+i);
    const iso=localISO(d);
    const inMonth=d.getMonth()===m;
    const tasks=data.tasks.filter(t=>t.date===iso);

    if(full){
      html+=`
        <div class="full-day ${inMonth?"":"other"} ${iso===localISO()?"today":""} ${iso===selectedDate?"selected":""}" data-select-date="${iso}">
          <b>${d.getDate()}</b>
          <div class="day-tasks">
            ${tasks.slice(0,3).map(t=>`<div class="day-task">${esc(t.title)}</div>`).join("")}
          </div>
        </div>`;
    }else{
      html+=`
        <div class="cal-day ${inMonth?"":"muted-day"} ${iso===localISO()?"today":""} ${tasks.length?"has-task":""} ${iso===selectedDate?"selected":""}" data-select-date="${iso}">
          ${d.getDate()}
        </div>`;
    }
  }
  c.innerHTML=html;
}
function renderSelectedDayTasks(targetId){
  const target=document.getElementById(targetId);
  const tasks=data.tasks
    .filter(t=>t.date===selectedDate)
    .sort((a,b)=>(a.time||"").localeCompare(b.time||""));

  const label=fmtDate(selectedDate,{weekday:"long",day:"2-digit",month:"long"});
  const titleDash=document.getElementById("selectedTasksTitle");
  const titleAgenda=document.getElementById("agendaTitle");

  if(titleDash) titleDash.textContent=`Tarefas — ${label}`;
  if(titleAgenda) titleAgenda.textContent=`Tarefas — ${label}`;

  if(!tasks.length){
    target.innerHTML=`<div class="empty">Nenhuma tarefa cadastrada para ${label}.</div>`;
    return;
  }

  target.innerHTML=`
    <div class="timeline-group">
      <h4>${label.toUpperCase()}</h4>
      ${tasks.map(t=>`
        <div class="timeline-item">
          <time>${t.time||"--:--"}</time>
          <strong>${esc(t.title)}</strong>
          <span class="tag ${t.area}">${areaNames[t.area]}</span>
        </div>
      `).join("")}
    </div>`;
}
function renderCalendar(){
  const selectedParts=selectedDate.split("-").map(Number);
  const selectedMonthDate=new Date(selectedParts[0],selectedParts[1]-1,1);

  buildCalendar("miniCalendar",selectedMonthDate,false);
  buildCalendar("fullCalendar",calendarCursor,true);

  document.getElementById("monthLabel").textContent=
    new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric"}).format(selectedMonthDate);

  document.getElementById("calendarTitle").textContent=
    new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric"}).format(calendarCursor);

  renderSelectedDayTasks("upcomingTasks");
  renderSelectedDayTasks("agendaList");
}

function renderAll(){
  dateLabels();renderMetrics();renderAreas();renderTasks();renderGoals();renderHabits();renderProjects();renderNotes();renderCalendar();
  requestAnimationFrame(()=>{drawLineChart("weeklyChart");drawLineChart("performanceChart")});
}

function openModal(id){document.getElementById(id).classList.add("open")}
function closeModal(id){document.getElementById(id).classList.remove("open")}

document.addEventListener("click",e=>{
  const dateCell=e.target.closest("[data-select-date]");
  if(dateCell){
    selectedDate=dateCell.dataset.selectDate;
    const [y,m,d]=selectedDate.split("-").map(Number);
    calendarCursor=new Date(y,m-1,1);
    renderCalendar();
    return;
  }

  const b=e.target.closest("button");if(!b)return;
  if(b.dataset.page)switchPage(b.dataset.page);
  if(b.dataset.pageJump)switchPage(b.dataset.pageJump);
  if(b.id==="mobileMenu")document.getElementById("sidebar").classList.toggle("open");
  if(["newTaskTop","newTaskPage","newTaskCalendar"].includes(b.id)){document.getElementById("taskDate").value=localISO();openModal("taskModal")}
  if(b.id==="newProject"){document.getElementById("projectDeadline").value=plusDays(30);openModal("projectModal")}
  if(b.id==="newGoal"){document.getElementById("goalDeadline").value=plusDays(60);openModal("goalModal")}
  if(b.id==="newHabit")openModal("habitModal");
  if(b.dataset.close)closeModal(b.dataset.close);
  if(b.dataset.toggleTask){const t=data.tasks.find(x=>x.id===b.dataset.toggleTask);if(t)t.done=!t.done;save()}
  if(b.dataset.deleteTask){data.tasks=data.tasks.filter(x=>x.id!==b.dataset.deleteTask);save()}
  if(b.dataset.toggleHabit){const h=data.habits.find(x=>x.id===b.dataset.toggleHabit);if(h){h.history??={};const d=localISO();h.history[d]=!h.history[d];if(!h.history[d])delete h.history[d]}save()}
  if(b.dataset.deleteHabit){data.habits=data.habits.filter(x=>x.id!==b.dataset.deleteHabit);save()}
  if(b.dataset.deleteGoal){data.goals=data.goals.filter(x=>x.id!==b.dataset.deleteGoal);save()}
  if(b.dataset.deleteProject){data.projects=data.projects.filter(x=>x.id!==b.dataset.deleteProject);save()}
  if(b.dataset.taskFilter){taskFilter=b.dataset.taskFilter;document.querySelectorAll("[data-task-filter]").forEach(x=>x.classList.toggle("active",x.dataset.taskFilter===taskFilter));renderTasks()}
  if(b.id==="prevMonth"){calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);renderCalendar()}
  if(b.id==="nextMonth"){calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);renderCalendar()}
  if(b.id==="todayBtn"){
    selectedDate=localISO();
    calendarCursor=new Date();
    switchPage("dashboard");
    renderCalendar();
  }
  if(b.dataset.areaFilter){switchPage("tarefas");taskFilter="todas";document.querySelectorAll("[data-task-filter]").forEach(x=>x.classList.toggle("active",x.dataset.taskFilter==="todas"));const area=b.dataset.areaFilter;document.getElementById("taskList").innerHTML=data.tasks.filter(t=>t.area===area).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).map(t=>taskRow(t)).join("")||`<div class="empty">Nenhuma tarefa em ${areaNames[area]}.</div>`}
});

document.addEventListener("change",e=>{
  if(e.target.dataset.goalProgress){const g=data.goals.find(x=>x.id===e.target.dataset.goalProgress);if(g){g.progress=Math.max(0,Math.min(100,+e.target.value||0));save()}}
});

document.getElementById("taskForm").addEventListener("submit",e=>{
  e.preventDefault();data.tasks.push({id:uid(),title:taskTitle.value.trim(),date:taskDate.value,time:taskTime.value,area:taskArea.value,priority:taskPriority.value,projectId:taskProject.value,done:false});e.target.reset();closeModal("taskModal");save()
});
document.getElementById("projectForm").addEventListener("submit",e=>{
  e.preventDefault();data.projects.push({id:uid(),title:projectTitle.value.trim(),area:projectArea.value,progress:Math.max(0,Math.min(100,+projectProgress.value||0)),deadline:projectDeadline.value});e.target.reset();closeModal("projectModal");save()
});
document.getElementById("goalForm").addEventListener("submit",e=>{
  e.preventDefault();data.goals.push({id:uid(),title:goalTitle.value.trim(),progress:Math.max(0,Math.min(100,+goalProgress.value||0)),deadline:goalDeadline.value});e.target.reset();closeModal("goalModal");save()
});
document.getElementById("habitForm").addEventListener("submit",e=>{
  e.preventDefault();data.habits.push({id:uid(),title:habitTitle.value.trim(),history:{}});e.target.reset();closeModal("habitModal");save()
});

let noteTimer;
document.getElementById("notes").addEventListener("input",e=>{
  noteStatus.textContent="Salvando...";noteCount.textContent=e.target.value.length+" caracteres";clearTimeout(noteTimer);noteTimer=setTimeout(()=>{data.notes=e.target.value;localStorage.setItem(KEY,JSON.stringify(data));noteStatus.textContent="Salvo automaticamente";renderNotes()},300)
});
document.querySelectorAll(".modal-backdrop").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.remove("open")}));
document.addEventListener("keydown",e=>{if(e.key==="Escape")document.querySelectorAll(".modal-backdrop.open").forEach(m=>m.classList.remove("open"))});
window.addEventListener("resize",()=>{drawLineChart("weeklyChart");drawLineChart("performanceChart")});

renderAll();
