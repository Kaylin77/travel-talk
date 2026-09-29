(function () {
  'use strict';

  const {scenes, phrases, tasks, notes, expressionNotes, essentialIds} = window.TT;
  const ui = window.TT_UI || {scenes:{},tasks:{},variants:{}};
  const sceneName = scene => ui.scenes[scene?.id]?.name || scene?.name || '';
  const sceneShort = scene => ui.scenes[scene?.id]?.short || sceneName(scene);
  const sceneDesc = scene => ui.scenes[scene?.id]?.desc || '';
  const taskName = task => ui.tasks[task?.id]?.title || task?.title || '';
  const taskDesc = task => ui.tasks[task?.id]?.desc || '';
  const variantName = title => ui.variants[title] || title;
  const phraseById = new Map(phrases.map(p => [p.id, p]));
  const sceneById = new Map(scenes.map(s => [s.id, s]));
  const taskById = new Map(tasks.map(t => [t.id, t]));
  const app = document.getElementById('app');
  const overlay = document.getElementById('overlay-root');
  const toast = document.getElementById('toast');
  const storageKey = 'triptalk-state-v1';
  let saved = readSaved();
  const personalLabels={'name':'Booking name','hotel':'Hotel','flight number':'Flight number','room number':'Room number','gate number':'Gate','destination':'Destination','airline':'Airline'};
  let modalFocusReturn=null;
  let view = parseHash();
  let filter = 'all';
  let searchTerm = '';
  let isComposing = false;
  let taskTab = 'dialogue';
  let hideTranslation = false;
  let practiceIndex = 0;
  let practiceRevealed = false;
  let selectedVoice = null;
  let offlineReady = false;
  let speechTimer = null;
  let toastTimer = null;
  let spaFields = { date:'', time:'20:00', people:'2', duration:'120', treatment:'spa treatment' };

  const icons = {home:'house', essential:'book-open', scenes:'compass', mine:'user-round', arrow:'arrow-right', chevron:'chevron-right', back:'arrow-left', search:'search', star:'star', sound:'volume-2', slow:'snail', expand:'maximize-2', copy:'copy', check:'check', bookmark:'bookmark', plane:'plane', bed:'bed-double', utensils:'utensils', bag:'shopping-bag', flower:'flower-2', train:'train-front', shield:'shield-alert', document:'file-text', sparkles:'sparkles', map:'map-pinned', clock:'clock-3', headphones:'headphones', info:'info', pencil:'pencil', close:'x', play:'play', layers:'layers-2', down:'chevron-down', book:'book-open', refresh:'rotate-ccw', download:'download', heart:'heart', calendar:'calendar-days', external:'external-link', wifi:'wifi', alert:'triangle-alert', globe:'globe-2', sun:'sun', microphone:'mic', eye:'eye', eyeoff:'eye-off', message:'message-circle-more', card:'credit-card', route:'route', offline:'radio-tower'};
  function icon(name, size=18, extra='') { return `<i data-lucide="${icons[name]||name}"${extra?` class="${extra}"`:''} style="width:${size}px;height:${size}px" aria-hidden="true"></i>`; }
  function esc(v) { return String(v??'').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x])); }
  function personalize(text) {return String(text||'').replace(/\[([^\]]+)\]/g,(whole,key)=>typeof saved.personal[key]==='string'&&saved.personal[key].trim()?saved.personal[key].trim():whole);}
  function readSaved() {
    try { const a=JSON.parse(localStorage.getItem(storageKey)); if(a && typeof a==='object') return {favorites:Array.isArray(a.favorites)?a.favorites:[], learned:Array.isArray(a.learned)?a.learned:[],personal:a.personal&&typeof a.personal==='object'?a.personal:{}}; }
    catch (_) {}
    return {favorites:[], learned:[],personal:{}};
  }
  function persist() { try {localStorage.setItem(storageKey, JSON.stringify(saved));} catch (_) {showToast('Progress could not be saved on this browser.');} }
  function parseHash() {
    const parts=location.hash.replace(/^#\/?/,'').split('/').filter(Boolean);
    return {page:parts[0]||'home', id:parts[1]||null};
  }
  function go(page,id) { location.hash=`#/${page}${id?`/${id}`:''}`; if(view.page===page && view.id===id) render(); }
  function showToast(message) { toast.textContent=message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove('show'),2700); }
  function sceneBadge(sceneId) { const s=sceneById.get(sceneId); return s?`<span class="pill">${icon(s.icon,11)} ${esc(sceneShort(s))}</span>`:''; }
  function countSceneTasks(sceneId){return tasks.filter(t=>t.scene===sceneId).length;}
  function sceneCountLabel(sceneId){return sceneId==='forms'?`${notes.length} 个关键词`:`${countSceneTasks(sceneId)} 个实用任务`;}
  function showIconSetup() { if(window.lucide) window.lucide.createIcons({attrs:{'stroke-width':1.45}}); }

  function shell(content) {
    const current = ['scene','task','spa-builder'].includes(view.page)?'scenes':['search','trip'].includes(view.page)?'home':view.page;
    return `<div class="app-shell">
      <main class="content ${esc(view.page)}" id="main-content">${content}</main>
      <nav class="bottom-nav" aria-label="Main navigation">
        ${[['home','Home'],['essential','Essentials'],['scenes','Explore'],['mine','Saved']].map(([id,label])=>`<button class="nav-item ${current===id?'active':''}" data-go="${id}" ${current===id?'aria-current="page"':''} title="${label}">${icon(id,23)}<span>${label}</span></button>`).join('')}
      </nav>
    </div>`;
  }

  function searchBar(value='', isMain=false) {
    return `<form class="search-wrap" id="search-form" role="search">${icon('search',20)}<input id="search-input" type="search" placeholder="Search phrases or situations" value="${esc(value)}" autocomplete="off" aria-label="Search in English or Chinese">${value?`<button type="button" class="icon-button" data-action="clear-search" title="Clear" aria-label="Clear search">${icon('close',17)}</button>`:`<button class="search-submit" type="submit" aria-label="Search">${icon('arrow',18)}</button>`}</form>`;
  }

  function sceneGlyph(id) {
    const emoji={airport:'✈️',hotel:'🏨',food:'🍽️',shopping:'🛍️',spa:'💆',transport:'🚆',help:'🆘',forms:'📝'};
    return `<span class="scene-emoji" aria-hidden="true">${emoji[id]||emoji.forms}</span>`;
  }

  function sceneCard(scene, compact=false) {
    return `<button class="${compact?'scene-page-card':'scene-card'}" data-go="scene" data-id="${scene.id}" title="${esc(sceneName(scene))}">
      <span class="scene-icon">${sceneGlyph(scene.id)}</span>
      ${compact?`<span><h2>${esc(sceneName(scene))}</h2><p>${esc(sceneDesc(scene))}</p></span>`:`<strong>${esc(sceneShort(scene))}</strong>`}
      ${compact?icon('chevron',17):''}
    </button>`;
  }

  function home() {
    const today=phrases.find(p=>p.en==='Sorry, I didn’t catch that.') || phraseById.get(essentialIds[0]);
    return `<div class="home">
      <div class="dashboard-head"><h1>Overview</h1><button class="text-link" data-go="trip">My trip ${icon('arrow',15)}</button></div>
      ${searchBar('',true)}
      <div class="section-head"><h2>Explore</h2><button class="text-link" data-go="scenes">View all ${icon('arrow',15)}</button></div>
      <div class="scene-grid">${scenes.map(scene=>sceneCard(scene)).join('')}</div>
      <div class="home-bottom"><section>${sectionTitle('In focus')}<div class="daily-card"><div class="daily-top"><span>WHEN YOU MISSED SOMETHING</span>${icon('message',16)}</div><p class="en">${esc(today.en)}</p><p class="zh">${esc(today.zh)}</p><div class="daily-actions"><button class="text-link" data-go="essential">Practice ${icon('arrow',15)}</button><button class="sound-button" data-action="speak" data-en="${esc(today.en)}" aria-label="Listen">${icon('sound',18)}</button></div></div></section>
      <section>${sectionTitle('My trip')}<button class="trip-card trip-link" data-go="trip"><div class="trip-top"><span class="trip-country">Malaysia</span><span class="trip-badge">8 days</span></div><div class="route">${['Penang','Langkawi','Kuala Lumpur'].map((city,i)=>`${i?'<span class="route-line"></span>':''}<span class="route-stop"><span class="route-dot"></span>${city}</span>`).join('')}</div><div class="trip-bottom"><span>Open travel kit</span>${icon('arrow',17)}</div></button></section></div>
      <button class="emergency-strip" data-go="scene" data-id="help">${icon('shield',19)}<span>Get help</span>${icon('arrow',16)}</button>
    </div>`;
  }

  function back(target='scenes') { return `<div class="back-row"><button data-go="${target}">${icon('back',17)} ${target==='home'?'Home':target==='scenes'?'Explore':'Back'}</button></div>`; }
  function sectionTitle(title,sub='') { return `<div class="section-head"><div><h2>${esc(title)}</h2>${sub?`<small>${esc(sub)}</small>`:''}</div></div>`; }

  function phraseCard(p, options={}) {
    const fav=saved.favorites.includes(p.id);
    const detail=expressionNotes[p.en];
    return `<article class="phrase-card" id="phrase-${p.id}"><div class="phrase-meta">${sceneBadge(p.scenes.find(id=>id!=='general'))}${detail?'<span class="pill">Natural expression</span>':''}</div>
      <p class="phrase-en" lang="en">${esc(personalize(p.en))}</p><p class="phrase-zh">${esc(p.zh)}</p>
      ${options.note && detail?`<div class="tip">${icon('sparkles',15)} <span><strong>${esc(detail.label)}</strong><br>${esc(detail.note)}${detail.alt?`<br><span lang="en">${esc(detail.alt)}</span> · ${esc(detail.altZh)}`:''}</span></div>`:''}
      <div class="phrase-bottom"><button class="sound-button" data-action="speak" data-en="${esc(personalize(p.en))}" title="Listen">${icon('sound',18)} Listen</button><div class="phrase-actions"><button class="icon-button ${fav?'is-saved':''}" data-action="favorite" data-id="${p.id}" title="${fav?'Unsave':'Save'}" aria-label="${fav?'Unsave':'Save phrase'}" aria-pressed="${fav}">${icon('bookmark',20)}</button><button class="icon-button" data-action="display" data-id="${p.id}" title="Show card" aria-label="Show card">${icon('expand',20)}</button></div></div>
    </article>`;
  }

  function essentialPage() {
    const learning=essentialIds.map(id=>phraseById.get(id)).filter(Boolean);
    const groups={all:learning, general:learning.filter(p=>p.scenes.includes('general')), travel:learning.filter(p=>!p.scenes.includes('general')&&!p.scenes.includes('help')), help:learning.filter(p=>p.scenes.includes('help'))};
    const selected=groups[filter]||groups.all;
    const learned=essentialIds.filter(id=>saved.learned.includes(id)).length;
    return `<div class="page-intro"><h1 class="page-title">Essentials</h1></div>
      <div class="progress-card"><div><strong>Learning progress</strong><div class="progress-track"><i style="width:${Math.round(learned/Math.max(1,essentialIds.length)*100)}%"></i></div></div><span class="progress-number">${learned}<small> / ${essentialIds.length}</small></span></div>
      <div class="chips" role="tablist" aria-label="Phrase categories">${[['all','All'],['general','Everyday'],['travel','Travel'],['help','Get help']].map(([id,label])=>`<button role="tab" class="chip ${filter===id?'active':''}" aria-selected="${filter===id}" data-action="filter" data-id="${id}">${label}</button>`).join('')}</div>
      
      <div class="phrase-list">${selected.map(p=>phraseCard(p,{note:true})).join('')}</div>`;
  }

  function scenesPage() {
    return `<div class="page-intro"><h1 class="page-title">Explore</h1></div>
      <div class="scene-page-grid">${scenes.map(s=>sceneCard(s,true)).join('')}</div>`;
  }

  function scenePage(scene) {
    if(scene.id==='forms') return formsPage();
    const list=tasks.filter(t=>t.scene===scene.id);
    return `<div class="task-page">${back()}<div class="scene-heading"><span class="scene-icon" style="--tint:${scene.tint};--color:${scene.color}">${icon(scene.icon,30)}</span><div><div class="page-label">${esc(scene.en)}</div><h1>${esc(sceneName(scene))}</h1><p>${esc(sceneDesc(scene))}</p></div></div>
      ${scene.id==='spa'?`<button class="secondary-button" data-go="spa-builder">${icon('pencil',17)} Build a booking message ${icon('arrow',14)}</button>`:''}
      
      <div class="task-list">${list.map((t,i)=>`<button class="task-card" data-go="task" data-id="${t.id}"><span class="task-number">${String(i+1).padStart(2,'0')}</span><span class="task-text"><strong>${esc(taskName(t))}</strong><p>${esc(taskDesc(t))}</p></span>${icon('chevron',17)}</button>`).join('')}</div>
      </div>`;
  }

  function formsPage() {
    return `<div class="task-page">${back()}<div class="scene-heading"><span class="scene-icon" style="--tint:#eef2f8;--color:#8c9bb5">${icon('document',30)}</span><div><div class="page-label">TRAVEL NOTES</div><h1>Travel notes</h1><p>Forms & useful terms</p></div></div>
      <div class="tip">${icon('info',16)} <span>这是英文理解辅助，不代替官方表格或最新入境要求。具体填写以目的地官方页面为准。</span></div>
      ${notes.map(n=>`<article class="reading-card"><span class="reading-label">TRAVEL TERM</span><h3 lang="en">${esc(n.en)}</h3><p><strong>${esc(n.zh)}</strong><br>${esc(n.body)}</p></article>`).join('')}
      <p class="notice">Official arrival card: <a href="https://imigresen-online.imi.gov.my/mdac/main" target="_blank" rel="noopener noreferrer">Malaysia Digital Arrival Card ${icon('external',12)}</a></p>
      </div>`;
  }

  function taskPage(task) {
    const scene=sceneById.get(task.scene);
    const quick=task.keys.slice(0,3).map(id=>phraseById.get(id)).filter(Boolean);
    const tab=(id,label,ico)=>`<button class="${taskTab===id?'active':''}" data-action="task-tab" data-id="${id}" role="tab" aria-selected="${taskTab===id}">${icon(ico,14)} ${label}</button>`;
    return `<div class="task-page"><div class="back-row"><button data-go="scene" data-id="${scene.id}">${icon('back',17)} ${esc(sceneName(scene))}</button><span>/ ${esc(taskName(task))}</span></div>
      <h1 class="page-title">${esc(taskName(task))}</h1><p class="task-description">${esc(taskDesc(task))}</p>
      <div class="segmented" role="tablist" aria-label="Lesson sections">${tab('quick','Phrases','message')}${tab('dialogue','Dialogue','headphones')}${tab('practice','Practice','microphone')}</div>
      ${taskTab==='quick'?quickContent(task,quick):taskTab==='dialogue'?dialogueContent(task):practiceContent(task)}
      ${taskTab!=='practice' && task.languageNote?`<div class="tip">${icon('sparkles',16)} <span><strong>Usage · ${esc(task.languageNote[0])}</strong><br>${esc(task.languageNote[1])}</span></div>`:''}
      ${task.tip?`<p class="notice">${icon('info',13)} ${esc(task.tip)}</p>`:''}
    </div>`;
  }

  function quickContent(task,quick) {
    return `${sectionTitle('Key phrases')}<div class="phrase-list">${quick.map(p=>phraseCard(p)).join('')}</div>
      ${task.variants.length?`${sectionTitle('Other situations')}${task.variants.map(group=>`<section class="variant"><h3>${esc(variantName(group.title))}</h3>${group.ids.map(id=>{const p=phraseById.get(id);return `<div class="variant-row"><button class="icon-button" data-action="speak" data-en="${esc(personalize(p.en))}" title="Listen" aria-label="Listen">${icon('sound',16)}</button><button class="icon-button" data-action="display" data-id="${id}" title="Show card" aria-label="Show card">${icon('expand',16)}</button><p lang="en">${esc(personalize(p.en))}</p><small>${esc(p.zh)}</small></div>`}).join('')}</section>`).join('')}`:''}`;
  }

  function dialogueContent(task) {
    const dialogue=task.dialogue;
    return `<div class="dialogue-controls"><span>${dialogue.length} lines</span><button class="switch-button" data-action="toggle-translation" aria-pressed="${hideTranslation}">${icon(hideTranslation?'eyeoff':'eye',15)} ${hideTranslation?'Show Chinese':'Hide Chinese'} <span class="switch-track ${hideTranslation?'on':''}"><i></i></span></button></div>
      <div class="dialogue">${dialogue.map(line=>`<div class="chat-row ${line.me?'me':''}"><span class="chat-avatar">${line.me?'You':'TA'}</span><div><div class="chat-role">${line.me?'You':'Staff'}</div><div class="chat-bubble"><p class="chat-en" lang="en">${esc(personalize(line.en))}</p>${hideTranslation?'':`<p class="chat-zh">${esc(line.zh)}</p>`}<div class="chat-play"><button data-action="speak" data-en="${esc(personalize(line.en))}" title="Listen" aria-label="Listen">${icon('sound',15)}</button></div></div></div></div>`).join('')}</div>
      <div class="button-row"><button class="secondary-button" data-action="play-dialogue">${icon('play',16)} Play dialogue</button><button class="primary-button" data-action="task-tab" data-id="practice">${icon('microphone',16)} Practice</button></div>
      ${task.variants.length?`${sectionTitle('Keep it going')}${task.variants.map(group=>`<section class="variant"><h3>${esc(variantName(group.title))}</h3>${group.ids.map(id=>{const p=phraseById.get(id);return `<div class="variant-row"><button class="icon-button" data-action="speak" data-en="${esc(personalize(p.en))}" title="Listen" aria-label="Listen">${icon('sound',16)}</button><p lang="en">${esc(personalize(p.en))}</p><small>${esc(p.zh)}</small></div>`}).join('')}</section>`).join('')}`:''}`;
  }

  function practiceContent(task) {
    const prompts=[];
    for(let i=0;i<task.dialogue.length;i++) if(task.dialogue[i].me) prompts.push({previous:task.dialogue[i-1]?.me===false?task.dialogue[i-1]:null,answer:task.dialogue[i]});
    if(!prompts.length)return '<div class="empty-state">No dialogue available.</div>';
    practiceIndex=Math.min(practiceIndex,prompts.length-1);
    const q=prompts[practiceIndex];
    return `<div class="practice-card"><div class="eyebrow">YOUR TURN · ${practiceIndex+1} / ${prompts.length}</div><p>Listen, then reply.</p>
      ${q.previous?`<div class="chat-bubble" style="text-align:left"><p class="chat-en" lang="en">${esc(personalize(q.previous.en))}</p><p class="chat-zh">${esc(q.previous.zh)}</p><button class="icon-button" data-action="speak" data-en="${esc(personalize(q.previous.en))}" title="Replay the prompt" aria-label="Replay the prompt">${icon('sound',17)}</button></div>`:`<h3>${esc(q.answer.zh)}</h3>`}
      ${q.previous?`<p>Your turn: ${esc(q.answer.zh)}</p>`:''}
      ${practiceRevealed?`<div class="practice-answer" lang="en">${esc(personalize(q.answer.en))}</div><div class="button-row"><button class="secondary-button" data-action="speak" data-en="${esc(personalize(q.answer.en))}">${icon('sound',16)} Listen</button><button class="primary-button" data-action="practice-next">${practiceIndex+1===prompts.length?'Restart':'Next'} ${icon('arrow',15)}</button></div>`:`<button class="primary-button" style="width:100%" data-action="practice-reveal">${icon('eye',16)} Reveal answer</button>`}
      </div><p class="notice">Try your own reply before revealing the example.</p>`;
  }

  function noteToDate(date) { if(!date) return ''; const [y,m,d]=date.split('-').map(Number); return new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric'}).format(new Date(y,m-1,d)); }
  function spaMessage() {
    const invalid=spaValidation();
    if(invalid)return invalid;
    const date=spaFields.date?noteToDate(spaFields.date):'[date]';
    const hour=spaFields.time?Number(spaFields.time.split(':')[0]):20;
    const minute=spaFields.time?spaFields.time.split(':')[1]:'00';
    const time=`${hour%12||12}:${minute} ${hour>=12?'p.m.':'a.m.'}`;
    const count=Number(spaFields.people);
    const duration=Number(spaFields.duration);
    const treatment=(spaFields.treatment||'spa treatment').trim();
    return `Hi! I’d like to book a ${duration}-minute ${treatment} for ${count} ${count===1?'person':'people'} on ${date} at ${time} ${count>1?`Could we ${count===2?'both':'all'} start at the same time?`:'Do you have availability at that time?'} Could you let me know the total price? Thank you!`;
  }

  function spaValidation(requireDate=false) {
    const count=Number(spaFields.people), duration=Number(spaFields.duration);
    if(!spaFields.people||!Number.isInteger(count)||count<1||count>20)return 'Enter a whole number of people, from 1 to 20.';
    if(!spaFields.duration||!Number.isInteger(duration)||duration<15||duration>480||duration%15!==0)return 'Choose 15–480 minutes, in 15-minute increments.';
    if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(spaFields.time))return 'Choose a valid time.';
    if(requireDate&&!spaFields.date)return 'Choose a date before copying.';
    return '';
  }

  function spaBuilder() {
    return `<div class="task-page">${back('scenes')}<h1 class="page-title">Book a spa</h1>
      <div class="form-card"><h2>Booking details</h2><div class="form-grid">
      <label class="field"><span>Date</span><input type="date" data-spa="date" value="${esc(spaFields.date)}"></label><label class="field"><span>Time</span><input type="time" data-spa="time" value="${esc(spaFields.time)}"></label>
      <label class="field"><span>People</span><input type="number" min="1" max="20" data-spa="people" value="${esc(spaFields.people)}"></label><label class="field"><span>Minutes per person</span><input type="number" min="15" max="480" step="15" data-spa="duration" value="${esc(spaFields.duration)}"></label>
      <label class="field full"><span>Treatment</span><select data-spa="treatment"><option value="spa treatment" ${spaFields.treatment==='spa treatment'?'selected':''}>Spa treatment</option><option value="massage" ${spaFields.treatment==='massage'?'selected':''}>Massage</option><option value="oil massage" ${spaFields.treatment==='oil massage'?'selected':''}>Oil massage</option></select></label></div>
      <div class="generated-message" id="spa-message" lang="en">${esc(spaMessage())}</div><div class="button-row"><button class="secondary-button" data-action="spa-speak">${icon('sound',16)} Listen</button><button class="primary-button" data-action="spa-copy">${icon('copy',16)} Copy message</button></div></div>
      <div class="tip">${icon('info',16)} <span>复制后核对日期、时长、项目和价格。店家确认有空位后，再确认预约是否成立。</span></div>
      <button class="text-link" data-go="task" data-id="spa-book">Practice this conversation ${icon('arrow',14)}</button>
    </div>`;
  }

  function tripPage() {
    const recommendations=[['airport','check-in','找到值机柜台'],['airport','immigration','回答入境问题'],['hotel','hotel-check-in','办理酒店入住'],['food','order','自然点餐'],['shopping','try-on','试穿换尺码'],['spa','spa-book','预约双人 SPA'],['transport','directions','问路与看地图']];
    return `<div class="task-page">${back('home')}<h1 class="page-title">Malaysia</h1>
      <div class="trip-card" style="margin:22px 0"><div class="trip-top"><span class="trip-badge">${icon('route',13)} 8 days · 7 nights</span><span class="trip-country">MALAYSIA</span></div><div class="route">${[['Penang',''],['Langkawi',''],['Kuala Lumpur','']].map((x,i)=>`${i?'<span class="route-line"></span>':''}<span class="route-stop"><span class="route-dot"></span>${x[0]}<small>${x[1]}</small></span>`).join('')}</div></div>
      ${sectionTitle('Travel kit')}
      <div class="task-list">${recommendations.map(([scene,id,title],i)=>`<button class="task-card" data-go="task" data-id="${id}"><span class="task-number">${String(i+1).padStart(2,'0')}</span><span class="task-text"><strong>${esc(taskName(taskById.get(id)))}</strong><p>${esc(sceneName(sceneById.get(scene)))} · ${esc(taskDesc(taskById.get(id)))}</p></span>${icon('chevron',17)}</button>`).join('')}</div>
      <button class="emergency-strip" data-go="scene" data-id="forms">${icon('document',18)} <span>Arrival card terms</span>${icon('chevron',16)}</button>
    </div>`;
  }

  function minePage() {
    const favorites=saved.favorites.map(id=>phraseById.get(id)).filter(Boolean);
    const learned=saved.learned.length;
    return `<div class="page-intro"><h1 class="page-title">Saved</h1></div>
      <div class="stat-row"><div class="stat"><strong>${favorites.length}</strong><span>Saved</span></div><div class="stat"><strong>${learned}</strong><span>Learned</span></div><div class="stat"><strong>${tasks.length}</strong><span>Situations</span></div></div>
      ${sectionTitle('Your phrases')}
      ${favorites.length?`<div class="phrase-list">${favorites.map(p=>phraseCard(p)).join('')}</div>`:`<div class="empty-state">${icon('bookmark',31)}<h3>No saved phrases yet</h3><p>Tap the bookmark on any phrase to save it here.</p></div>`}
      ${sectionTitle('Settings')}
      <div class="setting-group"><button class="setting-row" data-action="personal-info">${icon('pencil',19)}<span class="setting-text"><strong>Travel details</strong><small>Personalise names, hotels and flights</small></span>${icon('chevron',16)}</button><button class="setting-row" data-go="essential">${icon('book',19)}<span class="setting-text"><strong>Review essentials</strong><small>Everyday travel phrases</small></span>${icon('chevron',16)}</button><button class="setting-row" data-go="trip">${icon('map',19)}<span class="setting-text"><strong>My travel kit</strong><small>Penang · Langkawi · Kuala Lumpur</small></span>${icon('chevron',16)}</button><button class="setting-row" data-action="download-offline">${icon('download',19)}<span class="setting-text"><strong>${offlineReady?'Available offline':'Download for offline use'}</strong><small>${offlineReady?'Pages and phrases saved on this device':'Keep pages and phrases on your device'}</small></span>${icon(offlineReady?'check':'chevron',16)}</button></div>
      <p class="notice">Audio uses your device’s English voice. Offline playback depends on installed voices.</p>
      <button class="reset-link" data-action="reset-progress">Reset learning progress</button>`;
  }

  function searchResults(term) {
    const query=term.trim().toLocaleLowerCase();
    if(!query) return {taskMatches:[],phraseMatches:[],noteMatches:[]};
    const aliases={'不要辣':'不放辣椒','不吃辣':'不放辣椒','寄存行李':'行李寄存','两个人预约按摩':'双人','行李没到':'行李未到','大一号':'大一码','找厕所':'洗手间','没听懂':'没听清','预定':'预约','住店':'入住','买单':'结账'};
    const queries=[query,aliases[query]].filter(Boolean);
    const score=(hay,needle)=>{const h=String(hay||'').toLocaleLowerCase();return Math.max(...queries.map(n=>h.includes(n)?(h.startsWith(n)?2:1):0));};
    const taskMatches=tasks.map(t=>({item:t,value:Math.max(Math.max(score(t.title,query),score(taskName(t),query))*3,Math.max(score(t.desc,query),score(taskDesc(t),query))*2,score(t.keywords,query)*2,Math.max(score(sceneById.get(t.scene)?.name,query),score(sceneName(sceneById.get(t.scene)),query)),...t.dialogue.map(l=>score(l.zh,query)||score(l.en,query)),...t.variants.flatMap(group=>group.ids).map(id=>{const p=phraseById.get(id);return score(p?.zh,query)||score(p?.en,query);} ))})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value).slice(0,12).map(x=>x.item);
    const phraseMatches=phrases.map(p=>({item:p,value:Math.max(score(p.zh,query)*2,score(p.en,query),...p.scenes.map(id=>score(sceneById.get(id)?.name,query)))})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value).slice(0,20).map(x=>x.item);
    const noteMatches=notes.filter(n=>[n.zh,n.en,n.body].some(x=>score(x,query)));
    return {taskMatches,phraseMatches,noteMatches};
  }

  function searchPage() {
    const {taskMatches,phraseMatches,noteMatches}=searchResults(searchTerm);
    const count=taskMatches.length+phraseMatches.length+noteMatches.length;
    return `<div class="search-page">${back('home')}<h1 class="page-title">Search</h1><p class="page-description">English or Chinese.</p><div style="margin:20px 0">${searchBar(searchTerm)}</div>
      ${searchTerm?`<p class="result-count">${count} results for “${esc(searchTerm)}”</p>
      ${taskMatches.length?`${sectionTitle('Situations')}${taskMatches.map(t=>`<button class="task-card result-task" data-go="task" data-id="${t.id}"><span class="task-number">${icon(sceneById.get(t.scene).icon,19)}</span><span class="task-text"><strong>${esc(taskName(t))}</strong><p>${esc(sceneName(sceneById.get(t.scene)))} · ${esc(taskDesc(t))}</p></span>${icon('chevron',16)}</button>`).join('')}`:''}
      ${phraseMatches.length?`${sectionTitle('Phrases')}${`<div class="phrase-list">${phraseMatches.map(p=>phraseCard(p)).join('')}</div>`}`:''}
      ${noteMatches.length?`${sectionTitle('Travel notes')}${noteMatches.map(n=>`<article class="reading-card"><h3>${esc(n.en)}</h3><p><strong>${esc(n.zh)}</strong><br>${esc(n.body)}</p></article>`).join('')}`:''}
      ${!count?`<div class="empty-state">${icon('search',29)}<h3>No matches yet</h3><p>Try a shorter phrase, in English or Chinese.</p></div>`:''}`:`<div class="empty-state">${icon('search',29)}<h3>What do you need?</h3><p>Try “early check-in”, “spa” or “行李没到”.</p></div>`}
    </div>`;
  }

  function render(opts={}) {
    if(!opts.keepScroll) window.scrollTo({top:0,behavior:'instant'});
    let content;
    if(view.page==='home') content=home();
    else if(view.page==='essential') content=essentialPage();
    else if(view.page==='scenes') content=scenesPage();
    else if(view.page==='scene' && sceneById.has(view.id)) content=scenePage(sceneById.get(view.id));
    else if(view.page==='task' && taskById.has(view.id)) content=taskPage(taskById.get(view.id));
    else if(view.page==='spa-builder') content=spaBuilder();
    else if(view.page==='trip') content=tripPage();
    else if(view.page==='mine') content=minePage();
    else if(view.page==='search') content=searchPage();
    else {view={page:'home',id:null};content=home();}
    app.innerHTML=shell(content);
    showIconSetup();
    document.title = `${view.page==='task'?taskName(taskById.get(view.id)):view.page==='scene'?sceneName(sceneById.get(view.id)):({home:'Overview',essential:'Essentials',scenes:'Explore',mine:'Saved',search:'Search',trip:'Malaysia','spa-builder':'Book a spa'}[view.page]||'Travel English')} · TripTalk`;
  }

  function toggleSet(type,id) { const a=saved[type],i=a.indexOf(id); if(i>=0)a.splice(i,1);else a.push(id); persist(); render({keepScroll:true}); showToast(type==='favorites'?(i>=0?'Removed from saved':'Phrase saved'):(i>=0?'Marked as learning':'Marked as learned')); }
  function displayPhrase(id) {const p=phraseById.get(id);if(!p)return;
    modalFocusReturn=document.activeElement;
    overlay.innerHTML=`<div class="overlay" data-action="close-overlay"><section class="modal" role="dialog" aria-modal="true" aria-label="Show card"><div class="modal-top"><span>${icon('expand',16)} Show card</span><button class="icon-button" data-action="close-overlay" title="Close" aria-label="Close">${icon('close',20)}</button></div><p class="big-text" lang="en">${esc(personalize(p.en))}</p><p class="big-zh">${esc(p.zh)}</p><div class="button-row"><button class="secondary-button" data-action="speak" data-en="${esc(personalize(p.en))}">${icon('sound',18)} Listen</button><button class="primary-button" data-action="copy" data-en="${esc(personalize(p.en))}">${icon('copy',17)} Copy</button></div><p class="modal-note">Replace any brackets with your details.</p></section></div>`;
    const tokens=[...new Set([...p.en.matchAll(/\[([^\]]+)\]/g)].map(match=>match[1]))];
    if(tokens.length){
      const fields=document.createElement('div');
      fields.className='form-grid';
      fields.style.marginBottom='18px';
      fields.innerHTML=tokens.map(key=>`<label class="field full"><span>${esc(personalLabels[key]||key)} · English or pinyin</span><input data-phrase-field="${esc(key)}" data-phrase-id="${p.id}" value="${esc(saved.personal[key]||'')}" maxlength="150" placeholder="Your details"></label>`).join('');
      overlay.querySelector('.button-row').before(fields);
    }
    document.body.classList.add('no-scroll');showIconSetup();overlay.querySelector('.modal .icon-button')?.focus();
  }
  function personalInfo() {
    modalFocusReturn=document.activeElement;
    overlay.innerHTML=`<div class="overlay" data-action="close-overlay"><section class="modal" role="dialog" aria-modal="true" aria-label="Travel details"><div class="modal-top"><span>Travel details</span><button class="icon-button" data-action="close-overlay" title="Close" aria-label="Close">${icon('close',20)}</button></div><p class="notice">Use English or pinyin. Your details stay on this device and fill matching phrases automatically.</p><div class="form-grid">${Object.entries(personalLabels).map(([key,label])=>`<label class="field ${key==='hotel'?'full':''}"><span>${label}</span><input data-personal="${esc(key)}" maxlength="150" value="${esc(saved.personal[key]||'')}" placeholder="Optional"></label>`).join('')}</div><button class="primary-button" style="width:100%;margin-top:20px" data-action="save-personal">${icon('check',16)} Save details</button></section></div>`;
    document.body.classList.add('no-scroll');showIconSetup();overlay.querySelector('input')?.focus();
  }
  function closeOverlay() {const hadModal=!!overlay.firstChild;overlay.innerHTML='';document.body.classList.remove('no-scroll');if(hadModal&&modalFocusReturn?.isConnected)modalFocusReturn.focus();modalFocusReturn=null;}

  function selectVoice() {
    if(!('speechSynthesis' in window)) return null;
    const voices=speechSynthesis.getVoices().filter(v=>/^en[-_]/i.test(v.lang));
    selectedVoice=voices.find(v=>/natural|premium|samantha|daniel|google us english|google uk english/i.test(v.name))||voices.find(v=>/en[-_]GB/i.test(v.lang))||voices.find(v=>/en[-_]US/i.test(v.lang))||voices[0]||null;
    return selectedVoice;
  }
  function speak(text,slow=false,onDone) {
    if(!('speechSynthesis' in window)) {showToast('Speech playback is not supported in this browser.');return;}
    speechSynthesis.cancel();clearTimeout(speechTimer);
    const utterance=new SpeechSynthesisUtterance(personalize(text).replace(/\[([^\]]+)\]/g,(_,key)=>`your ${key}`).replace(/\s+/g,' ').trim());
    utterance.lang=selectedVoice?.lang||'en-US';utterance.rate=slow?.74:.91;utterance.pitch=1;
    const voice=selectVoice(); if(voice) {utterance.voice=voice;utterance.lang=voice.lang;}
    utterance.onend=()=>{document.querySelectorAll('.speaking').forEach(el=>el.classList.remove('speaking'));onDone?.();};
    utterance.onerror=()=>{document.querySelectorAll('.speaking').forEach(el=>el.classList.remove('speaking'));};
    speechSynthesis.speak(utterance);
  }
  function playDialogue(lines,index=0) {
    if(index>=lines.length)return;
    speak(personalize(lines[index].en),false,()=>{speechTimer=setTimeout(()=>playDialogue(lines,index+1),380);});
  }
  async function copyText(value) {
    try { await navigator.clipboard.writeText(value);showToast('Copied to clipboard'); }
    catch (_) { const area=document.createElement('textarea');area.value=value;area.style.cssText='position:fixed;left:-9999px;top:0';document.body.append(area);area.select();const ok=document.execCommand('copy');area.remove();showToast(ok?'Copied to clipboard':'Could not copy. Please select the text.'); }
  }

  async function serviceWorkerMessage(type) {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return null;
    const registration = await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Service worker not ready')),7000))]);
    const worker = navigator.serviceWorker.controller || registration.active;
    if (!worker) return null;
    return new Promise((resolve,reject)=>{
      const channel = new MessageChannel();
      const timer = setTimeout(()=>reject(new Error('timeout')),7000);
      channel.port1.onmessage=event=>{clearTimeout(timer);resolve(event.data);channel.port1.close();};
      worker.postMessage({type},[channel.port2]);
    });
  }

  async function checkOfflineStatus() {
    try {offlineReady=!!(await serviceWorkerMessage('CACHE_STATUS'))?.ready;if(view.page==='mine')render({keepScroll:true});}
    catch (_) {offlineReady=false;}
  }

  document.addEventListener('click',event=>{
    const target=event.target.closest('[data-action],[data-go]'); if(!target)return;
    const action=target.dataset.action;
    if(target.dataset.go){ if(view.page==='task') {taskTab='dialogue';practiceIndex=0;practiceRevealed=false;} go(target.dataset.go,target.dataset.id);return; }
    if(action==='filter'){filter=target.dataset.id;render({keepScroll:true});return;}
    if(action==='task-tab'){taskTab=target.dataset.id;practiceIndex=0;practiceRevealed=false;render({keepScroll:true});return;}
    if(action==='favorite'){toggleSet('favorites',target.dataset.id);return;}
    if(action==='learned'){toggleSet('learned',target.dataset.id);return;}
    if(action==='display'){displayPhrase(target.dataset.id);return;}
    if(action==='personal-info'){personalInfo();return;}
    if(action==='save-personal'){for(const el of overlay.querySelectorAll('[data-personal]'))saved.personal[el.dataset.personal]=el.value.trim();persist();closeOverlay();render({keepScroll:true});showToast('Details saved. Your phrases are now personalised.');return;}
    if(action==='close-overlay'){if((target.classList.contains('overlay')&&event.target===target)||target.closest('.modal .icon-button'))closeOverlay();return;}
    if(action==='speak'){target.classList.add('speaking');speak(target.dataset.en);return;}
    if(action==='toggle-translation'){hideTranslation=!hideTranslation;render({keepScroll:true});return;}
    if(action==='play-dialogue'){playDialogue(taskById.get(view.id)?.dialogue||[]);return;}
    if(action==='practice-reveal'){practiceRevealed=true;render({keepScroll:true});return;}
    if(action==='practice-next'){const count=taskById.get(view.id)?.dialogue.filter(l=>l.me).length||1;practiceIndex=(practiceIndex+1)%count;practiceRevealed=false;render({keepScroll:true});return;}
    if(action==='copy'){copyText(target.dataset.en||'');return;}
    if(action==='spa-speak'){const invalid=spaValidation();if(invalid){showToast(invalid);return;}speak(spaMessage());return;}
    if(action==='spa-copy'){const invalid=spaValidation(true);if(invalid){showToast(invalid);const el=[...document.querySelectorAll('[data-spa]')].find(x=>!x.checkValidity());el?.reportValidity();return;}copyText(spaMessage());return;}
    if(action==='download-offline'){
      target.disabled=true;
      showToast('Saving offline content…');
      serviceWorkerMessage('CACHE_OFFLINE').then(result=>{
        offlineReady=!!result?.ok;
        showToast(offlineReady?'Offline content ready. Audio depends on your device.':'Download incomplete. Reconnect and try again.');
        render({keepScroll:true});
      }).catch(()=>{showToast('Could not download. Check your connection and use HTTPS.');target.disabled=false;});
      return;
    }
    if(action==='reset-progress'){if(confirm('Clear all saved phrases and learning progress?')){saved={favorites:[],learned:[],personal:saved.personal};persist();render({keepScroll:true});showToast('Learning progress cleared');}return;}
    if(action==='clear-search'){searchTerm='';render({keepScroll:true});document.getElementById('search-input')?.focus();}
  });
  document.addEventListener('submit',event=>{
    if(event.target.id!=='search-form')return;event.preventDefault();
    searchTerm=event.target.querySelector('input')?.value.trim()||'';
    if(view.page!=='search')go('search');else render({keepScroll:true});
  });
  document.addEventListener('input',event=>{
    const el=event.target;
    if(el.matches('[data-phrase-field]')){saved.personal[el.dataset.phraseField]=el.value;persist();const phrase=phraseById.get(el.dataset.phraseId);if(phrase){const text=personalize(phrase.en);overlay.querySelector('.big-text').textContent=text;overlay.querySelectorAll('[data-en]').forEach(button=>button.dataset.en=text);}return;}
    if(el.matches('[data-spa]')) {spaFields[el.dataset.spa]=el.value;const box=document.getElementById('spa-message');if(box)box.textContent=spaMessage();}
    if(el.id==='search-input' && view.page==='search' && !event.isComposing && !isComposing) queueSearch(el);
  });
  function queueSearch(el){searchTerm=el.value;clearTimeout(window.__tripTalkSearchTimer);window.__tripTalkSearchTimer=setTimeout(()=>{if(isComposing||view.page!=='search')return;const start=el.selectionStart;render({keepScroll:true});const fresh=document.getElementById('search-input');fresh?.focus();fresh?.setSelectionRange(start,start);},200);}
  document.addEventListener('compositionstart',event=>{if(event.target.id==='search-input'){isComposing=true;clearTimeout(window.__tripTalkSearchTimer);}});
  document.addEventListener('compositionend',event=>{if(event.target.id==='search-input'){isComposing=false;if(view.page==='search')queueSearch(event.target);}});
  window.addEventListener('hashchange',()=>{clearTimeout(window.__tripTalkSearchTimer);clearTimeout(speechTimer);if('speechSynthesis' in window) speechSynthesis.cancel();view=parseHash();taskTab='dialogue';practiceIndex=0;practiceRevealed=false;closeOverlay();render();});
  window.addEventListener('keydown',event=>{if(event.key==='Escape')closeOverlay();if(event.key==='Tab'&&overlay.firstChild){const nodes=[...overlay.querySelectorAll('button,input,select,a[href],textarea')].filter(el=>!el.disabled);const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}});
  window.addEventListener('online',()=>showToast('Back online'));
  window.addEventListener('offline',()=>showToast('Offline. Saved pages and phrases are still available.'));
  if('speechSynthesis' in window){selectVoice();speechSynthesis.addEventListener?.('voiceschanged',selectVoice);}
  if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    const hadController=!!navigator.serviceWorker.controller;let reloading=false;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadController&&!reloading){reloading=true;location.reload();}else checkOfflineStatus();});
    navigator.serviceWorker.register('./sw.js').then(checkOfflineStatus).catch(()=>{});
  }
  render();
})();
