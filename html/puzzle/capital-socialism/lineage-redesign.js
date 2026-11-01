(()=>{
  const D=window.LINEAGE_DATA;if(!D)return;
  const $=s=>document.querySelector(s);
  const $$=s=>document.querySelectorAll(s);
  
  const view=D.view,nodes=D.nodes,relations=D.relations,placement=D.backbone.placementByNodeId;
  const byId=Object.fromEntries(Object.entries(nodes));
  
  const laneColor={capitalism:'var(--capitalism)',socialism:'var(--socialism)',interface:'var(--interface)','historical-context':'var(--context)',reactionary:'var(--reactionary)'};
  const bands=view.timeBands, lanes=view.lanes;
  const bandIndex=Object.fromEntries(bands.map((x,i)=>[x.id,i]));
  const laneIndex=Object.fromEntries(lanes.map((x,i)=>[x.id,i]));
  
  const canvas=$('#canvas'), workspace=$('#workspace'), edgeLayer=$('#edgeLayer');
  const timeAxis=$('#timeAxis'), laneAxis=$('#laneAxis');
  const detailPanel=$('#detailPanel'), detailContent=$('#detailContent');
  const directoryOverlay=$('#directoryOverlay'), directoryGrid=$('#directoryGrid');
  const introOverlay=$('#exhibitIntro'), tourBar=$('#tourBar'), aboutOverlay=$('#aboutOverlay');
  const canvasEmpty=$('#canvasEmpty');
  
  const mainNodes=Object.entries(placement).map(([id,p])=>({id,p}));
  // 主画布是展览主体：只折叠语义高度重复或仍有争议的末级分支。
  const hiddenDefault=new Set(['collectivist-anarchism','revolutionary-syndicalism','nasserism','contemporary-far-right-disputed']);
  const urlShowAll=new URLSearchParams(location.search).get('nodes')==='all';
  let showAllNodes=urlShowAll;
  const hiddenState=new Set(urlShowAll?[]:hiddenDefault);
  const positions={};
  let selected=null;
  let activeDetailTab='overview';
  let activeFilter='all';
  let searchQuery='';
  let showMilestones=true;
  let directorySphere='all';
  let directoryType='all';
  let directoryTopic='all';
  const topicViews=[
    {id:'marxism-leninism',title:'马克思主义—列宁主义',anchors:['marxism-leninism','marxism']},
    {id:'social-democracy',title:'社会民主与福利国家',anchors:['social-democracy','welfare-state']},
    {id:'anarchism-syndicalism',title:'无政府主义与工团主义',anchors:['anarchism','revolutionary-syndicalism']},
    {id:'anticolonial-socialism',title:'反殖民社会主义',anchors:['anticolonial-socialism','decolonization']},
    {id:'new-left-ecology-feminism',title:'新左翼、生态与女性主义',anchors:['new-left','socialist-feminism']},
    {id:'fascism-continuities',title:'法西斯主义及其延续',anchors:['fascism','postwar-neo-fascism']}
  ];

  const sphereOf=id=>{
    const value=placement[id]?.laneId||byId[id]?.sphere||'context';
    // 契约映射：node.schema 的 classification.sphere 用 `bridge`，画布 lane 与 UI 用 `interface`
    const normalized=value==='bridge'?'interface':value;
    return normalized==='historical-context'?'context':normalized;
  };
  const searchableText=(id,n=byId[id])=>[
    id,n?.name?.zhHans,n?.name?.en,n?.name?.original,n?.aliases?.join(' '),n?.summary,n?.entityType,n?.timeLabel,
    (n?.classification?.tags||[]).map(tag=>String(tag).replace(/^(place|person|debate|theme):/,'')).join(' '),
    (n?.classification?.tags||[]).join(' '),n?.classification?.sphere,n?.classification?.family
  ].filter(Boolean).join(' ').toLowerCase();
  const matchesFilter=id=>activeFilter==='all'||sphereOf(id)===activeFilter;
  const matchesSearch=id=>!searchQuery||searchableText(id).includes(searchQuery);
  const relationList=Array.isArray(relations)?relations:Object.entries(relations||{}).map(([id,relation])=>({id,...relation}));
  const relationById=Array.isArray(relations)?Object.fromEntries(relations.map(relation=>[relation.id,relation])):relations;
  const relationClass=type=>{
    if(['influences','elective_affinity','borrows_rhetoric','theoretical_influence','responds_to','enables','accelerates'].includes(type))return 'influence';
    if(['institutionalizes','implements','stabilizes'].includes(type))return 'institutional';
    if(['competes_with','undermines','terminates_rule','generates_crisis_for'].includes(type))return 'conflict';
    return 'lineage';
  };
  const entityLabels={tradition:'思想传统',concept:'概念',institution:'制度',collection:'集合',movement:'运动',policy:'政策',person:'人物',work:'著作',organization:'组织',event:'事件',period:'历史时期',state:'国家'};
  const sphereLabels={capitalism:'资本主义',socialism:'社会主义',interface:'制度交错与回应',context:'共同历史条件','historical-context':'共同历史条件',reactionary:'反动政治传统'};
  const certaintyLabels={confirmed:'已确认',probable:'较可信',disputed:'有争议',speculative:'推测',curatorial:'策展关系',unknown:'未定'};
  const relationLabels={develops_from:'发展自',variant_of:'变体',succeeds:'继承',split_from:'分裂自',reforms_into:'改革为',transforms:'转化',institutionalizes:'制度化',theoretical_influence:'思想影响',responds_to:'回应',enables:'促成',implements:'实施',undermines:'削弱',competes_with:'竞争',terminates_rule:'终结',generates_crisis_for:'造成危机',accelerates:'加速',stabilizes:'稳定',member_of:'归组',belongs_to:'谱系归属',curatorial_link:'策展相邻',borrows_rhetoric:'借用修辞',elective_affinity:'选择性亲和',influences:'影响',authored_by:'所著',participated_in:'参与',member_of_factual:'事实成员'};
  const relationEnds=relation=>[
    relation?.source?.id||relation?.source||relation?.from||relation?.sourceId,
    relation?.target?.id||relation?.target||relation?.to||relation?.targetId
  ];
  const relatedNodeIds=id=>{
    const related=new Set();
    relationList.forEach(relation=>{
      const [from,to]=relationEnds(relation);
      if(from===id&&to)related.add(to);
      if(to===id&&from)related.add(from);
    });
    const parentId=placement[id]?.parentId;
    if(parentId)related.add(parentId);
    (D.backbone.childNodeIdsByParentId[id]||[]).forEach(childId=>related.add(childId));
    return related;
  };
  
  // 视口状态
  const viewport={scale:1,minScale:0.2,maxScale:2,x:0,y:0,dragging:false,startX:0,startY:0};
  // S4 缩放语义层级：远景看结构、中景读节点、近景看档案线索
  const ZOOM_TIERS={far:0.6,near:1.2};
  const TIER_LABELS={far:'远景 · 结构',mid:'中景 · 节点',near:'近景 · 档案'};
  const tierForScale=scale=>scale<ZOOM_TIERS.far?'far':scale>ZOOM_TIERS.near?'near':'mid';
  
  // 画布尺寸配置 - 增大间距
  const BAND_WIDTH = 440;
  const BAND_START = 220;
  const LANE_HEIGHT = 640;
  const LANE_START = 260;
  const NODE_WIDTH = 204;
  const NODE_HEIGHT = 108;
  const MIN_H_GAP = 250;  // 最小水平间距
  const MIN_V_GAP = 130;  // 最小垂直间距
  
  const xForBand = bandId => BAND_START + (bandIndex[bandId] ?? 0) * BAND_WIDTH;
  const yForLane = laneId => LANE_START + (laneIndex[laneId] ?? 0) * LANE_HEIGHT;
  const bandName=band=>band.title||band.name||band.label||band.id;
  const laneName=lane=>lane.title||lane.name||lane.label||lane.id;
  const colorFor = id => laneColor[placement[id]?.laneId || byId[id]?.sphere] || 'var(--context)';
  const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const visibleMain = () => mainNodes.filter(({id})=>!hiddenState.has(id));
  const displayedMain = () => visibleMain().filter(({id})=>matchesFilter(id)&&matchesSearch(id));
  const nodeName=id=>byId[id]?.name?.zhHans||byId[id]?.name||id;
  const milestoneItems=()=>showMilestones?(view.milestones||[]).filter(item=>byId[item.nodeId]):[];
  
  function renderAxes(){
    timeAxis.innerHTML=bands.map(band=>`
      <button class="time-marker" data-band-id="${esc(band.id)}" style="left:${xForBand(band.id)-BAND_WIDTH/2}px;width:${BAND_WIDTH}px">
        <span class="time-marker-label">${esc(bandName(band))}</span>
      </button>
    `).join('');
    laneAxis.innerHTML=lanes.map(lane=>`
      <button class="lane-marker" data-lane-id="${esc(lane.id)}" style="top:${yForLane(lane.id)-LANE_HEIGHT/2}px;height:${LANE_HEIGHT}px;--lane-color:${laneColor[lane.id]||'var(--context)'}">
        <span class="lane-marker-label">${esc(laneName(lane))}</span>
      </button>
    `).join('');
    timeAxis.style.width=`${BAND_START*2+(bands.length-1)*BAND_WIDTH}px`;
    laneAxis.style.height=`${LANE_START*2+(lanes.length-1)*LANE_HEIGHT}px`;

    $$('.time-marker').forEach(marker=>marker.onclick=()=>centerOnCoordinate(marker.dataset.bandId,null));
    $$('.lane-marker').forEach(marker=>marker.onclick=()=>centerOnCoordinate(null,marker.dataset.laneId));
  }

  function currentCoordinate(){
    const rect=workspace.getBoundingClientRect();
    const canvasX=(rect.width/2-viewport.x)/viewport.scale;
    const canvasY=(rect.height/2-viewport.y)/viewport.scale;
    const nearestBand=bands.reduce((best,band)=>Math.abs(xForBand(band.id)-canvasX)<Math.abs(xForBand(best.id)-canvasX)?band:best,bands[0]);
    const nearestLane=lanes.reduce((best,lane)=>Math.abs(yForLane(lane.id)-canvasY)<Math.abs(yForLane(best.id)-canvasY)?lane:best,lanes[0]);
    return {band:nearestBand,lane:nearestLane};
  }

  function syncAxes(){
    const workspaceRect=workspace.getBoundingClientRect();
    const timeAxisRect=$('.axis-horizontal').getBoundingClientRect();
    const laneAxisRect=$('.axis-vertical').getBoundingClientRect();
    const timeOffset=timeAxisRect.left-workspaceRect.left;
    const laneOffset=laneAxisRect.top-workspaceRect.top;
    timeAxis.style.transform=`translateX(${viewport.x-timeOffset}px) scaleX(${viewport.scale})`;
    laneAxis.style.transform=`translateY(${viewport.y-laneOffset}px) scaleY(${viewport.scale})`;
    $$('.time-marker').forEach(marker=>marker.style.setProperty('--label-scale',1/viewport.scale));
    $$('.lane-marker').forEach(marker=>marker.style.setProperty('--label-scale',1/viewport.scale));
    const {band,lane}=currentCoordinate();
    $$('.time-marker').forEach(marker=>marker.classList.toggle('active',marker.dataset.bandId===band.id));
    $$('.lane-marker').forEach(marker=>marker.classList.toggle('active',marker.dataset.laneId===lane.id));
    $('#currentCoordinate').textContent=`${bandName(band)} · ${laneName(lane)}`;
  }

  function applyViewport(){
    canvas.style.transform=`translate(${viewport.x}px,${viewport.y}px) scale(${viewport.scale})`;
    const tier=tierForScale(viewport.scale);
    canvas.dataset.zoomLevel=tier;
    const zoomLevel=$('#zoomLevel');
    if(zoomLevel)zoomLevel.textContent=`${Math.round(viewport.scale*100)}%`;
    const zoomTier=$('#zoomTier');
    if(zoomTier)zoomTier.textContent=TIER_LABELS[tier];
    syncAxes();
  }

  function setViewportScale(nextScale,clientX,clientY){
    const rect=workspace.getBoundingClientRect();
    const anchorX=clientX??rect.width/2;
    const anchorY=clientY??rect.height/2;
    const canvasX=(anchorX-viewport.x)/viewport.scale;
    const canvasY=(anchorY-viewport.y)/viewport.scale;
    viewport.scale=Math.max(viewport.minScale,Math.min(viewport.maxScale,nextScale));
    viewport.x=anchorX-canvasX*viewport.scale;
    viewport.y=anchorY-canvasY*viewport.scale;
    applyViewport();
  }
  
  function zoomBy(delta,clientX,clientY){
    setViewportScale(viewport.scale+delta,clientX,clientY);
  }

  function centerOnCoordinate(bandId,laneId){
    const rect=workspace.getBoundingClientRect();
    const currentX=(rect.width/2-viewport.x)/viewport.scale;
    const currentY=(rect.height/2-viewport.y)/viewport.scale;
    const targetX=bandId?xForBand(bandId):currentX;
    const targetY=laneId?yForLane(laneId):currentY;
    viewport.x=rect.width/2-targetX*viewport.scale;
    viewport.y=rect.height/2-targetY*viewport.scale;
    applyViewport();
  }

  function centerOnNode(id){
    const pos=positions[id];
    if(!pos)return;
    const rect=workspace.getBoundingClientRect();
    viewport.x=rect.width/2-pos.x*viewport.scale;
    viewport.y=rect.height/2-pos.y*viewport.scale;
    applyViewport();
  }

  function fitView(){
    const visiblePositions=displayedMain().map(({id})=>positions[id]).filter(Boolean);
    if(!visiblePositions.length)return resetView();
    const rect=workspace.getBoundingClientRect();
    const minX=Math.min(...visiblePositions.map(pos=>pos.x))-NODE_WIDTH;
    const maxX=Math.max(...visiblePositions.map(pos=>pos.x))+NODE_WIDTH;
    const minY=Math.min(...visiblePositions.map(pos=>pos.y))-NODE_HEIGHT;
    const maxY=Math.max(...visiblePositions.map(pos=>pos.y))+NODE_HEIGHT;
    const scale=Math.max(viewport.minScale,Math.min(1,(rect.width-150)/(maxX-minX),(rect.height-150)/(maxY-minY)));
    viewport.scale=scale;
    viewport.x=(rect.width-(minX+maxX)*scale)/2;
    viewport.y=(rect.height-(minY+maxY)*scale)/2;
    applyViewport();
  }
  
  function resetView(){
    // 重置视图 = 回到整张总图的概览，而不是左上角 100% 的盲区
    const hasVisible=displayedMain().some(({id})=>positions[id]);
    if(hasVisible){fitView();return;}
    viewport.scale=1;viewport.x=0;viewport.y=0;
    applyViewport();
  }
  
  // 改进的力导向布局算法 - 解决重叠问题
  function calculateNodePositions(){
    const tempPos={};
    const groups={};
    displayedMain().forEach(({id,p})=>{
      const key=`${p.timeBandId}|${p.laneId}`;
      (groups[key]||(groups[key]=[])).push(id);
    });

    // 确定性槽位布局：每个时段×泳道单元内最多两列，绝不让卡片共享坐标。
    Object.entries(groups).forEach(([key,ids])=>{
      const [bandId,laneId]=key.split('|');
      ids.sort((a,b)=>(placement[a].order||0)-(placement[b].order||0)||a.localeCompare(b));
      const columns=ids.length>=4?2:1;
      const rows=Math.ceil(ids.length/columns);
      const xGap=NODE_WIDTH+24;
      const yGap=NODE_HEIGHT+42;
      ids.forEach((id,index)=>{
        const column=index%columns;
        const row=Math.floor(index/columns);
        tempPos[id]={
          x:xForBand(bandId)+(column-(columns-1)/2)*xGap,
          y:yForLane(laneId)+(row-(rows-1)/2)*yGap
        };
      });
    });
    return tempPos;
  }
  
  // 绘制网格
  function renderGrid(){
    const grid=$('#grid');
    grid.innerHTML='';
    
    // 垂直线（时间带）
    bands.forEach((band,i)=>{
      const x=BAND_START+i*BAND_WIDTH;
      const line=document.createElement('div');
      line.className='canvas-grid-line-v';
      line.style.left=x+'px';
      grid.appendChild(line);
    });
    
    // 水平线（泳道）
    lanes.forEach((lane,i)=>{
      const y=LANE_START+i*LANE_HEIGHT;
      const line=document.createElement('div');
      line.className='canvas-grid-line-h';
      line.style.top=y+'px';
      grid.appendChild(line);
    });
  }
  
  // 渲染画布
  function renderCanvas(){
    // 清空现有节点与里程碑
    $$('.node-card, .milestone-card, .milestone-connector, .milestone-band-label').forEach(el=>el.remove());
    edgeLayer.innerHTML='';
    
    // 计算位置
    const calcPos=calculateNodePositions();
    Object.keys(positions).forEach(id=>delete positions[id]);
    Object.assign(positions,calcPos);
    
    // 设置画布尺寸
    const positionValues=Object.values(calcPos);
    const maxX=(positionValues.length?Math.max(...positionValues.map(p=>p.x)):BAND_START)+BAND_WIDTH;
    const maxY=(positionValues.length?Math.max(...positionValues.map(p=>p.y)):LANE_START)+LANE_HEIGHT;
    canvas.style.width=maxX+'px';
    canvas.style.height=maxY+'px';
    edgeLayer.setAttribute('width',maxX);
    edgeLayer.setAttribute('height',maxY);
    
    // 渲染连线
    displayedMain().forEach(({id})=>{
      const parentId=placement[id]?.parentId;
      if(!parentId || hiddenState.has(parentId))return;
      const p1=positions[parentId];
      const p2=positions[id];
      if(!p1||!p2)return;
      
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      const dx=p2.x-p1.x;
      const mid=p1.x+dx*0.5;
      const d=`M ${p1.x} ${p1.y} H ${mid} V ${p2.y} H ${p2.x}`;
      path.setAttribute('d',d);
      path.classList.add('lineage');
      if(placement[id]?.parentBasis==='curatorial-display')path.classList.add('curatorial');
      path.dataset.from=parentId;
      path.dataset.to=id;
      edgeLayer.appendChild(path);
    });

    // 精选辅助关系以语义着色；不把全部 1063 条关系倾倒到总图。
    (view.secondaryEdges||[]).filter(edge=>edge.defaultVisible).forEach(edge=>{
      const relation=relationById[edge.relationId];
      if(!relation)return;
      const [from,to]=relationEnds(relation);
      const p1=positions[from],p2=positions[to];
      if(!p1||!p2)return;
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      const bend=p1.x+(p2.x-p1.x)*.5;
      path.setAttribute('d',`M ${p1.x} ${p1.y} H ${bend} V ${p2.y} H ${p2.x}`);
      path.classList.add('secondary',relationClass(relation.type));
      path.dataset.from=from;
      path.dataset.to=to;
      path.dataset.type=relation.type;
      edgeLayer.appendChild(path);
    });
    
    // 渲染节点
    displayedMain().forEach(({id,p})=>{
      const n=byId[id];
      const pos=positions[id];
      if(!pos)return;
      
      const card=document.createElement('article');
      card.className='node-card';
      card.tabIndex=0;
      card.setAttribute('role','button');
      card.dataset.id=id;
      card.style.left=pos.x+'px';
      card.style.top=pos.y+'px';
      card.style.setProperty('--accent',colorFor(id));
      
      const kids=(D.backbone.childNodeIdsByParentId[id]||[]).filter(x=>hiddenState.has(x));
      
      card.innerHTML=`
        <div class="node-header">
          <div class="node-heading">
            <h3 class="node-title">${esc(n.name.zhHans||n.name)}</h3>
            <span class="node-english">${esc(n.name.en||'')}</span>
          </div>
          <div class="node-indicator"></div>
        </div>
        <p class="node-summary">${esc(n.summary||'暂无摘要')}</p>
        <div class="node-meta">
          <div class="node-time">${esc(n.timeLabel||'时间未定')}</div>
          <div class="node-role">${esc(entityLabels[n.entityType]||n.entityType||'节点')} · ${n.sourceCount||0} 来源${kids.length?` · 折叠${kids.length}`:''}</div>
        </div>
      `;
      
      card.onclick=()=>showNodeDetail(id);
      card.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();showNodeDetail(id);}};
      if(kids.length){
        const branchButton=document.createElement('button');
        branchButton.className='branch-toggle';
        branchButton.textContent=`+${kids.length}`;
        branchButton.title=`展开 ${kids.map(nodeName).join('、')}`;
        branchButton.onclick=event=>{event.stopPropagation();kids.forEach(childId=>hiddenState.delete(childId));renderCanvas();$('#resultCount').textContent=`${displayedMain().length} 个主干节点`;};
        card.appendChild(branchButton);
      }
      canvas.appendChild(card);
    });

    if(showMilestones){
      // 里程碑放在泳道边缘的留白带上，并按真实卡片尺寸做碰撞检测，
      // 避免早期版本「事件标签压住节点卡」的问题。
      const MW=186, MH=48, CARD_W=NODE_WIDTH, CARD_H=124, PAD=8;
      const cardBoxes=Object.entries(positions).map(([id,pos])=>({x:pos.x,y:pos.y,w:CARD_W,h:CARD_H}));
      const placedMilestones=[];
      const hits=(x,y,box)=>Math.abs(x-box.x)<(MW+box.w)/2+PAD&&Math.abs(y-box.y)<(MH+box.h)/2+PAD;
      milestoneItems().forEach(item=>{
        const n=byId[item.nodeId];
        const anchors=(item.attachTo||[]).filter(id=>positions[id]).map(id=>({id,pos:positions[id]}));
        if(!anchors.length)return;
        const centerX=anchors.reduce((sum,anchor)=>sum+anchor.pos.x,0)/anchors.length;
        const centerY=anchors.reduce((sum,anchor)=>sum+anchor.pos.y,0)/anchors.length;
        const bandX=xForBand(item.timeBandId);
        const clampX=x=>Math.max(bandX-BAND_WIDTH*.42,Math.min(bandX+BAND_WIDTH*.42,x));
        const laneIds=[...new Set(anchors.map(anchor=>placement[anchor.id]?.laneId).filter(Boolean))];
        const yCandidates=[];
        laneIds.forEach(laneId=>{
          const laneY=yForLane(laneId);
          yCandidates.push(laneY-(LANE_HEIGHT/2+14),laneY+(LANE_HEIGHT/2+14));
        });
        yCandidates.push(centerY-150,centerY+150);
        const xCandidates=[clampX(centerX),clampX(bandX),clampX(bandX-BAND_WIDTH*.3),clampX(bandX+BAND_WIDTH*.3)];
        const candidates=[];
        yCandidates.forEach(y=>xCandidates.forEach(x=>candidates.push({x,y})));
        let chosen=null,fallback=null;
        for(const candidate of candidates){
          if(!fallback)fallback=candidate;
          if(cardBoxes.some(box=>hits(candidate.x,candidate.y,box)))continue;
          if(placedMilestones.some(box=>hits(candidate.x,candidate.y,box)))continue;
          chosen=candidate;break;
        }
        const pos=chosen||fallback||{x:clampX(centerX),y:centerY-150};
        placedMilestones.push({x:pos.x,y:pos.y,w:MW,h:MH});
        const card=document.createElement('button');
        card.className=`milestone-card ${item.role==='event'?'event':'organization'}`;
        card.dataset.id=item.nodeId;
        card.style.left=`${pos.x}px`;
        card.style.top=`${pos.y}px`;
        card.innerHTML=`<span class="milestone-glyph" aria-hidden="true">${item.role==='event'?'◆':'⬡'}</span><span class="milestone-copy"><span class="milestone-year">${esc(n.timeLabel||bandName(bands[bandIndex[item.timeBandId]]))}</span><strong>${esc(nodeName(item.nodeId))}</strong></span>`;
        card.onclick=()=>showNodeDetail(item.nodeId);
        canvas.appendChild(card);
        anchors.forEach(anchor=>{
          const path=document.createElementNS('http://www.w3.org/2000/svg','path');
          const bend=(anchor.pos.x+pos.x)/2;
          path.setAttribute('d',`M ${anchor.pos.x} ${anchor.pos.y} H ${bend} V ${pos.y} H ${pos.x}`);
          path.classList.add('milestone-link');
          path.dataset.from=item.nodeId;
          edgeLayer.appendChild(path);
        });
      });
    }
    
    renderGrid();
    if(canvasEmpty)canvasEmpty.hidden=displayedMain().length>0;
  }
  
  // 显示节点详情
  function showNodeDetail(id){
    closeLesson();
    selected=id;
    const n=byId[id];
    const p=placement[id];
    
    // 高亮一跳关系与主干父子节点，保留用户的上下文。
    const related=relatedNodeIds(id);
    $$('.node-card').forEach(card=>{
      const isActive=card.dataset.id===id;
      const isRelated=related.has(card.dataset.id);
      card.classList.toggle('active',isActive);
      card.classList.toggle('dimmed',!isActive && !isRelated);
      card.classList.toggle('related',isRelated);
    });
    $$('#edgeLayer path').forEach(path=>{
      const isRelated=path.dataset.from===id||path.dataset.to===id;
      path.classList.toggle('highlight',isRelated);
      path.classList.toggle('dimmed',!isRelated);
    });
    
    const nodeRelations=(n.incidentRelationIds||[]).map(relationId=>({...relationById[relationId],id:relationId})).filter(relation=>relation.source&&relation.target);
    // 史实关系=有证据（正/反）或已确认的史实边；谱系归属=belongs_to 归组边；策展相邻只报数量。
    const isLineage=relation=>relation.type==='belongs_to'||relation.type==='member_of';
    const hasEvidence=relation=>(relation.evidenceCount||0)>0;
    const factualRelations=nodeRelations.filter(relation=>!isLineage(relation)&&(hasEvidence(relation)||['confirmed','probable','disputed'].includes(relation.certainty)))
      .sort((a,b)=>(b.evidenceCount||0)-(a.evidenceCount||0)).slice(0,10);
    const lineageRelations=nodeRelations.filter(isLineage).slice(0,8);
    const curatorialCount=nodeRelations.filter(relation=>relation.type==='curatorial_link'||relation.certainty==='curatorial').length;
    const parentId=p?.parentId;
    const childIds=(D.backbone.childNodeIdsByParentId[id]||[]).slice(0,8);
    const geography=[...(n.geography?.regions||[]),...(n.geography?.countries||[]),...(n.geography?.origin||[])];
    const aliases=n.aliases||[];
    const lineageRows=lineageRelations.map(relation=>{
      const [from,to]=relationEnds(relation);
      const otherId=from===id?to:from;
      return `<button class="detail-link-row lineage-row" data-node="${esc(otherId)}"><span><strong>${esc(nodeName(otherId))}</strong><small>${esc(relationLabels[relation.type]||relation.type)} · 谱系归属（策展分组，非史实因果）</small></span><em>${esc(certaintyLabels[relation.certainty]||relation.certainty)}</em></button>`;
    }).join('');
    const sourceTitle=sourceId=>D.sources?.[sourceId]?.title||sourceId;
    const evidenceRows=relation=>(relation.evidenceList||[]).map(item=>{
      const mark=item.direction==='contradicts'?'反':'正';
      const scopeLabel={relation:'关系',"source-node":'起点',"target-node":'终点'}[item.scope]||'关系';
      return `<li class="evidence-row"><span class="evidence-mark ${item.direction==='contradicts'?'contra':'pro'}">${mark}</span><div><p>${esc(item.claim||'')}</p><small>${esc(sourceTitle(item.sourceId))}${item.locator?` · ${esc(item.locator)}`:''} · 指向${scopeLabel}</small></div></li>`;
    }).join('');
    const relationRow=relation=>{
      const [from,to]=relationEnds(relation);
      const otherId=from===id?to:from;
      const direction=from===id?'向下/输出':'向上/输入';
      const count=relation.evidenceCount||0;
      const legacy=relation.legacyEvidenceCount||0;
      const badge=count?`<em class="evidence-badge ok">${count} 条证据${relation.contradicts?` · 反 ${relation.contradicts}`:''}</em>`:`<em class="evidence-badge none">0 条证据</em>`;
      const pendingNote=(!count&&relation.evidenceNote)?`<p class="evidence-empty evidence-empty-checked">${esc(relation.evidenceNote)}</p>`:(!count&&legacy)?`<p class="evidence-empty">该关系列了 ${legacy} 项来源，但还没写成可核对的证据卡（缺论断与定位），暂按“待证”处理。</p>`:(!count?`<p class="evidence-empty">该关系尚未挂证据，先按“待证”阅读。</p>`:'');
      return `<div class="relation-row"><button class="detail-link-row" data-node="${esc(otherId)}"><span><strong>${esc(nodeName(otherId))}</strong><small>${esc(relationLabels[relation.type]||relation.type)} · ${direction}</small></span><em>${esc(certaintyLabels[relation.certainty]||relation.certainty)} · ${badge}</em></button>${count?`<ul class="evidence-list">${evidenceRows(relation)}</ul>`:pendingNote}</div>`;
    };
    const relationRows=factualRelations.map(relationRow).join('')
      || (lineageRelations.length
        ? `<p class="evidence-empty evidence-empty-checked">这个条目目前只有策展归属，还没有可核对的史实关系：本展把它编进某一组，但尚未断言它与其他条目之间存在因果或谱系关联。读者可先看下方「谱系归属」，或按标签与来源继续检索。</p>`
        : `<p class="evidence-empty">这个条目还没有关系与归属，属于目录条目；本展保留它是为了检索与交叉引用。</p>`);
    const parentBasisLabels={'curatorial-display':'策展显示（非事实因果）','source-relation':'事实关系','root':'根节点'};
    const branchRows=[...(parentId?[`<button class="detail-link-row" data-node="${esc(parentId)}"><span><strong>${esc(nodeName(parentId))}</strong><small>${p.parentBasis==='curatorial-display'?'策展父级':'事实父级'}</small></span><em>${esc(parentBasisLabels[p.parentBasis]||p.parentBasis||'显示结构')}</em></button>`]:[]),...childIds.map(childId=>`<button class="detail-link-row" data-node="${esc(childId)}"><span><strong>${esc(nodeName(childId))}</strong><small>下游分支</small></span><em>${hiddenState.has(childId)?'当前折叠':'主图显示'}</em></button>`)].join('');
    const sourceCards=(n.sources||[]).map(sourceId=>{
      const source=D.sources?.[sourceId];
      if(!source)return `<article class="source-card missing"><span>来源记录待补齐</span><strong>${esc(sourceId)}</strong></article>`;
      const typeLabel={primary:'原始文献',academic:'学术研究',public:'公共资料'}[source.sourceType]||source.sourceType;
      const content=`<span>${esc(typeLabel)} · ${esc(source.year||'年份未定')}</span><strong>${esc(source.title)}</strong><small>${esc((source.authors||[]).join('、')||source.publication||'')}</small>${source.notes?`<p>${esc(source.notes)}</p>`:''}`;
      return source.url?`<a class="source-card" href="${esc(source.url)}" target="_blank" rel="noreferrer">${content}<em>打开来源 ↗</em></a>`:`<article class="source-card">${content}</article>`;
    }).join('');
    const tagChips=(n.classification?.tags||[]).slice(0,10).map(tag=>{
      const [kind,...rest]=String(tag).split(':');
      const label=rest.join(':')||tag;
      const kindName={place:'地点',person:'人物',debate:'争点',theme:'主题'}[kind];
      return `<span class="tag-chip" title="${esc(kindName||'标签')}">${esc(label)}</span>`;
    }).join('');
    const reviewLabels={verified:'已核验',pending:'待审校',provisional:'暂定',disputed:'有争议'};
    const deepSectionLabels={theory:'理论主张',practice:'实践与制度',history:'历史脉络',strengths:'贡献与优点',critiques:'批评与局限',legacy:'后世影响'};
    const deepDive=n.deepDive||null;
    const lesson=D.lessons?.[id]||null;
    const lessonButton=lesson?`<button class="lesson-jump" data-lesson-jump>读这篇演绎（${lesson.blocks.length} 块）→</button>`:'';
    const deepSections=deepDive?Object.keys(deepSectionLabels).filter(key=>deepDive[key]).map(key=>`<div class="detail-section deep-section" data-deep="${key}"><div class="detail-section-title">${deepSectionLabels[key]} / ${key.toUpperCase()}</div><p>${esc(deepDive[key])}</p></div>`).join(''):'';
    const deepPanel=deepDive?`<section class="detail-tab-panel" data-detail-panel="deep" hidden><div class="detail-section deep-intro"><div class="detail-section-title">深读 / DEEP DIVE</div><p>以下按「理论—实践—历史—贡献—批评—影响」六段展开，便于逐层理解该词条；所有判断以本页来源与主流史学/理论综述为据，争议处保留不同立场。本页是学术讨论文本，不是政治宣传或行动号召。</p></div>${deepSections}${deepDive.legacy?`<div class="detail-section deep-legacy-note"><p class="detail-empty">延伸阅读与引用见「来源」页。</p></div>`:''}</section>`:`<section class="detail-tab-panel" data-detail-panel="deep" hidden><div class="detail-section"><div class="detail-section-title">深读 / DEEP DIVE</div><p class="detail-empty">该词条的深读内容正在编写中；目前可先阅读「概览」中的摘要与「来源」页的文献。</p></div></section>`;
    detailContent.innerHTML=`
      <section class="detail-tab-panel" data-detail-panel="overview">
        <div class="detail-section detail-identity"><div class="detail-section-title">身份 / NODE IDENTITY</div><h3>${esc(n.name.zhHans||n.name)}</h3><p class="detail-english">${esc(n.name.en||'')}</p><p>${esc(n.summary||'')}</p>${deepDive?`<button class="deep-jump" data-deep-jump>阅读深读：理论 · 实践 · 历史 · 得失 · 影响 →</button>`:''}${lessonButton}${aliases.length?`<div class="detail-tags">${aliases.map(alias=>`<span>${esc(alias)}</span>`).join('')}</div>`:''}${tagChips?`<div class="detail-tags detail-tag-chips">${tagChips}</div>`:''}</div>
        <div class="detail-section"><div class="detail-section-title">基本资料 / METADATA</div><div class="detail-meta-grid">
          <div class="detail-meta-item"><div class="detail-meta-label">历史时期</div><div class="detail-meta-value">${esc(n.timeLabel||'未定')}</div></div><div class="detail-meta-item"><div class="detail-meta-label">实体类型</div><div class="detail-meta-value">${esc(entityLabels[n.entityType]||n.entityType)}</div></div><div class="detail-meta-item"><div class="detail-meta-label">领域</div><div class="detail-meta-value">${esc(sphereLabels[sphereOf(id)]||sphereOf(id))}</div></div><div class="detail-meta-item"><div class="detail-meta-label">来源</div><div class="detail-meta-value">${n.sourceCount||0} 项</div></div>
        </div>${geography.length?`<div class="detail-inline"><b>地域</b><span>${geography.map(esc).join(' · ')}</span></div>`:''}</div>
      </section>
      ${deepPanel}
      <section class="detail-tab-panel" data-detail-panel="relations" hidden>
        ${branchRows?`<div class="detail-section"><div class="detail-section-title">结构位置 / CURATED POSITION</div><div class="detail-link-list">${branchRows}</div></div>`:''}
        <div class="detail-section"><div class="detail-section-title">史实关系 / EVIDENCE</div><p class="detail-hint">每条关系下面挂具体证据：<span class="evidence-mark pro">正</span>支持该关系，<span class="evidence-mark contra">反</span>反驳或限定该关系。没有证据的关系标为「0 证据」。</p><div class="detail-link-list">${relationRows||'<p class="detail-empty">暂无带证据的史实关系。</p>'}</div></div>
        ${lineageRows?`<div class="detail-section"><div class="detail-section-title">谱系归属 / LINEAGE</div><div class="detail-link-list">${lineageRows}</div></div>`:''}
        ${curatorialCount?`<div class="detail-section"><div class="detail-section-title">策展相邻 / CURATORIAL</div><p class="detail-empty">另有 ${curatorialCount} 条策展相邻关系，用来把词条排在一篇演绎里，不代表史实因果；需要时在「全部关系」中展开。</p></div>`:''}
      </section>
      <section class="detail-tab-panel" data-detail-panel="sources" hidden>
        <div class="detail-section"><div class="detail-section-title">来源 / SOURCES</div><div class="detail-source-summary"><strong>${n.sources?.length||0}</strong><span>条来源记录</span></div><div class="source-list">${sourceCards||'<p class="detail-empty">该条目尚未关联来源目录。</p>'}</div></div>
      </section>
      <section class="detail-tab-panel" data-detail-panel="curation" hidden>
        <div class="detail-section"><div class="detail-section-title">策展状态 / CURATION</div><div class="curation-status"><span>${esc(reviewLabels[n.editorial?.reviewStatus]||n.editorial?.reviewStatus||'待审校')}</span><span>${n.disputed?'含争议标记':'一般条目'}</span><span>${n.inBackbone?'总图主干':'档案/局部节点'}</span></div><p>${n.disputed?'该条目或其归类包含争议；关系强度和策展位置不代表价值判断。':'关系与显示位置依照当前来源和策展视图生成。'}</p></div>
        <div class="detail-section"><div class="detail-section-title">显示原则</div><p>总图只展示主要历史脉络；多重来源、人物、著作和组织由完整档案目录承接。策展父边用于稳定阅读结构，不等于思想具有唯一来源。</p></div>
      </section>
    `;
    
    detailPanel.classList.add('visible');
    document.body.classList.add('detail-open');
    $('#focusSelected').disabled=!positions[id];
    $$('.detail-link-row').forEach(button=>button.onclick=()=>showNodeDetail(button.dataset.node));
    const activateDetailTab=tab=>{
      activeDetailTab=tab;
      $$('#detailTabs button').forEach(button=>button.classList.toggle('active',button.dataset.detailTab===tab));
      $$('.detail-tab-panel').forEach(panel=>panel.hidden=panel.dataset.detailPanel!==tab);
    };
    $$('#detailTabs button').forEach(button=>button.onclick=()=>{activateDetailTab(button.dataset.detailTab);detailPanel.scrollTop=0;});
    activateDetailTab(activeDetailTab);
    $$('.lesson-jump').forEach(button=>button.onclick=()=>openLesson(id));
    $$('.deep-jump').forEach(button=>button.onclick=()=>{activateDetailTab('deep');detailPanel.scrollTop=0;});
  }
  
  // 关闭详情
  $('#closeDetail').onclick=()=>{
    detailPanel.classList.remove('visible');
    document.body.classList.remove('detail-open');
    selected=null;
    $('#focusSelected').disabled=true;
    $$('.node-card').forEach(card=>{
      card.classList.remove('active','dimmed','related');
    });
    $$('#edgeLayer path').forEach(path=>path.classList.remove('highlight','dimmed'));
  };

  // 演绎：左侧面板，与右侧档案详情互斥
  const lessonPanel=$('#lessonPanel'), lessonContent=$('#lessonContent');
  const lessonKindLabels={hook:'钩子',naming:'命名',mechanism:'机制',pro:'正方',contra:'反方',controversy:'争点',ledger:'代价账本',narrative:'延长线',judgment:'本展判断',bridge:'过渡'};
  function closeLesson(){
    if(!lessonPanel)return;
    lessonPanel.classList.remove('visible');
    document.body.classList.remove('lesson-open');
  }
  function openLesson(id){
    const lesson=D.lessons?.[id];
    if(!lesson||!lessonPanel)return;
    detailPanel.classList.remove('visible');
    document.body.classList.remove('detail-open');
    const byBlock={};
    (lesson.blocks||[]).forEach(block=>{byBlock[block.id]=block;});
    const citationList=block=>{
      const list=block.citations||[];
      if(!list.length)return '';
      return `<ol class="lesson-cites">${list.map(citation=>{
        const source=D.sources?.[citation.sourceId];
        const title=source?.title||citation.sourceId;
        const text=`${esc(title)}${citation.locator?` · ${esc(citation.locator)}`:''}`;
        const quote=citation.quote?`<blockquote class="lesson-cite-quote">${esc(citation.quote)}</blockquote>`:'';
        const link=source?.url?`<a href="${esc(source.url)}" target="_blank" rel="noreferrer">${text} ↗</a>`:text;
        return `<li>${quote}${link}</li>`;
      }).join('')}</ol>`;
    };
    const sections=(lesson.sections||[]).map(section=>{
      const body=(section.blockIds||[]).map(blockId=>{
        const block=byBlock[blockId];
        if(!block)return '';
        const stance=['pro','contra','editorial'].includes(block.stance)?block.stance:'';
        return `<article class="lesson-block ${stance}"><div class="lesson-block-kind">${esc(lessonKindLabels[block.kind]||block.kind)}</div>${block.title?`<h4>${esc(block.title)}</h4>`:''}<p>${esc(block.text||'')}</p>${citationList(block)}</article>`;
      }).join('');
      return `<section class="lesson-section"><h3>${esc(section.title||'')}</h3>${body}</section>`;
    }).join('');
    const falsify=lesson.editorial?.falsifiedBy?`<div class="lesson-falsify"><b>可推翻条件 / FALSIFIED BY</b><p>${esc(lesson.editorial.falsifiedBy)}</p></div>`:'';
    lessonContent.innerHTML=`<div class="lesson-head"><h2>${esc(lesson.title||nodeName(id))}</h2><p>${esc(nodeName(id))} · ${(lesson.blocks||[]).length} 块 · 引文可点开原文</p></div>${sections}${falsify}`;
    lessonPanel.classList.add('visible');
    document.body.classList.add('lesson-open');
    lessonContent.scrollTop=0;
  }
  if($('#closeLesson'))$('#closeLesson').onclick=closeLesson;

  // 演绎目录：把已有的演绎集中列出来，读者不必先猜该点哪个词条
  function renderLessonIndex(){
    const lessons=D.lessons||{};
    const order=['tradition','concept','institution','event','period','policy','work','organization','person','collection'];
    const typeLabel={tradition:'传统与思潮',concept:'概念',institution:'制度',event:'事件',period:'时期',policy:'政策',work:'文本',organization:'组织',person:'人物',collection:'专题集合'};
    const rows=Object.values(lessons).map(lesson=>{
      const node=byId[lesson.nodeId]||{};
      const blocks=(lesson.blocks||[]).length;
      const chars=(lesson.blocks||[]).reduce((sum,block)=>sum+String(block.text||'').replace(/\s/g,'').length,0);
      return {lesson,node,blocks,chars,type:node.entityType||'concept'};
    }).sort((a,b)=>order.indexOf(a.type)-order.indexOf(b.type)||b.chars-a.chars);
    const sections=order.filter(type=>rows.some(row=>row.type===type)).map(type=>{
      const items=rows.filter(row=>row.type===type).map(({lesson,node,blocks,chars})=>`
        <button class="lesson-index-item" data-lesson-node="${esc(lesson.nodeId)}">
          <strong>${esc(lesson.title||node?.name?.zhHans||lesson.nodeId)}</strong>
          <small>${esc(node?.name?.en||'')}</small>
          <em>${blocks} 块 · ${chars} 字</em>
        </button>`).join('');
      return `<section class="lesson-section"><h3>${esc(typeLabel[type]||type)}</h3><div class="lesson-index-list">${items}</div></section>`;
    }).join('');
    const total=rows.length;
    const chars=rows.reduce((sum,row)=>sum+row.chars,0);
    lessonContent.innerHTML=`<div class="lesson-head"><h2>演绎</h2><p>${total} 篇演绎 · 共 ${chars} 字 · 每节都给出正反双方最强论证与本展判断</p></div>${sections}`;
    $$('[data-lesson-node]').forEach(button=>button.onclick=()=>{
      const id=button.dataset.lessonNode;
      if(byId[id])showNodeDetail(id);
      openLesson(id);
    });
    lessonPanel.classList.add('visible');
    document.body.classList.add('lesson-open');
    lessonContent.scrollTop=0;
  }
  if($('#lessonsBtn'))$('#lessonsBtn').onclick=renderLessonIndex;
  
  // 目录
  $('#directoryBtn').onclick=()=>{
    directoryOverlay.classList.add('visible');
    renderDirectoryNavigation();
    renderDirectory();
  };
  
  $('#closeDirectory').onclick=()=>{
    directoryOverlay.classList.remove('visible');
  };
  
  const sphereOptions=[['all','全部领域'],['capitalism','资本主义'],['socialism','社会主义'],['interface','交错与回应'],['context','共同条件'],['reactionary','反动传统']];

  function renderDirectoryNavigation(){
    const sphereCounts=Object.keys(byId).reduce((counts,id)=>{const key=sphereOf(id);counts[key]=(counts[key]||0)+1;return counts;},{});
    $('#directorySphereFilters').innerHTML=sphereOptions.map(([id,label])=>`<button class="directory-nav-item ${directorySphere===id?'active':''}" data-sphere="${id}"><span>${label}</span><small>${id==='all'?Object.keys(byId).length:(sphereCounts[id]||0)}</small></button>`).join('');
    const typeCounts=Object.values(byId).reduce((counts,n)=>{counts[n.entityType]=(counts[n.entityType]||0)+1;return counts;},{});
    $('#directoryTypeFilters').innerHTML=[['all','全部类型'],...Object.keys(typeCounts).sort().map(type=>[type,entityLabels[type]||type])].map(([id,label])=>`<button class="directory-nav-item ${directoryType===id?'active':''}" data-type="${id}"><span>${label}</span><small>${id==='all'?Object.keys(byId).length:typeCounts[id]}</small></button>`).join('');
    const topics=D.topics||{};
    const topicEntries=Object.values(topics).map(topic=>[topic.id,topic.title,(topic.includedNodes||[]).length]);
    $('#directoryTopicFilters').innerHTML=[['all','全部专题',Object.keys(byId).length],...topicEntries].map(([id,label,count])=>`<button class="directory-nav-item ${directoryTopic===id?'active':''}" data-topic="${esc(id)}"><span>${esc(label)}</span><small>${count}</small></button>`).join('');
    $$('.directory-nav-item[data-topic]').forEach(button=>button.onclick=()=>{directoryTopic=button.dataset.topic;renderDirectoryNavigation();renderDirectory();});
    $$('.directory-nav-item[data-sphere]').forEach(button=>button.onclick=()=>{directorySphere=button.dataset.sphere;renderDirectoryNavigation();renderDirectory();});
    $$('.directory-nav-item[data-type]').forEach(button=>button.onclick=()=>{directoryType=button.dataset.type;renderDirectoryNavigation();renderDirectory();});
  }

  function renderDirectory(){
    const query=$('#directorySearch').value.trim().toLowerCase();
    const sort=$('#directorySort').value;
    const list=Object.entries(byId).filter(([id,n])=>{
      const sphereMatch=directorySphere==='all'||sphereOf(id)===directorySphere;
      const typeMatch=directoryType==='all'||n.entityType===directoryType;
      const topicMatch=directoryTopic==='all'||(D.topics&&D.topics[directoryTopic]&&((D.topics[directoryTopic].includedNodes)||[]).includes(id));
      return sphereMatch&&typeMatch&&topicMatch&&(!query||searchableText(id,n).includes(query));
    }).sort(([,a],[,b])=>{
      if(sort==='sources')return (b.sourceCount||0)-(a.sourceCount||0);
      if(sort==='time')return String(a.timeLabel||'').localeCompare(String(b.timeLabel||''),'zh-CN');
      return String(a.name?.zhHans||a.name||'').localeCompare(String(b.name?.zhHans||b.name||''),'zh-CN');
    });
    $('#directoryCount').textContent=`${list.length} / ${Object.keys(byId).length} 条档案`;
    directoryGrid.innerHTML=list.length?list.map(([id,n])=>`
      <button class="directory-card" data-id="${esc(id)}" style="--accent:${colorFor(id)}">
        <span class="directory-card-title">${esc(n.name.zhHans||n.name)}</span>
        <span class="directory-card-meta">${esc(entityLabels[n.entityType]||n.entityType)} · ${esc(n.timeLabel||'时间未定')} · ${n.sourceCount||0} 来源</span>
        <span class="directory-card-summary">${esc(n.summary||'暂无摘要')}</span>
      </button>
    `).join(''):`<div class="empty-state">没有找到匹配档案<br><span>试试缩短关键词或调整侧栏条件</span></div>`;
    
    $$('.directory-card').forEach(card=>{
      card.onclick=()=>{
        directoryOverlay.classList.remove('visible');
        showNodeDetail(card.dataset.id);
      };
    });
  }

  $('#directorySearch').addEventListener('input',renderDirectory);
  $('#directorySort').addEventListener('change',renderDirectory);

  function applyDiscoveryFilters(){
    renderCanvas();
    const count=displayedMain().length;
    $('#resultCount').textContent=`${count} 个主干节点`;
    if(selected&&!displayedMain().some(({id})=>id===selected))$('#closeDetail').click();
  }

  $$('.filter-chip').forEach(chip=>{
    chip.addEventListener('click',()=>{
      activeFilter=chip.dataset.filter;
      $$('.filter-chip').forEach(item=>item.classList.toggle('active',item===chip));
      applyDiscoveryFilters();
    });
  });
  $('.filter-chip[data-filter="all"]').classList.add('active');

  $('#globalSearch').addEventListener('input',event=>{
    searchQuery=event.target.value.trim().toLowerCase();
    applyDiscoveryFilters();
  });

  $('#milestoneToggle').onclick=event=>{
    showMilestones=!showMilestones;
    event.currentTarget.classList.toggle('active',showMilestones);
    renderCanvas();
  };

  // 密度开关（S5）：默认隐藏折叠末级节点，可展开全部主干。
  const collapsedTerminalCount=mainNodes.filter(({id})=>hiddenDefault.has(id)).length;
  const syncDensityButton=()=>{
    const btn=$('#densityToggle');
    if(!btn)return;
    btn.classList.toggle('active',showAllNodes);
    btn.textContent=showAllNodes?'默认视图':'全部节点';
    btn.title=showAllNodes
      ?`回到默认 ${mainNodes.length-collapsedTerminalCount} 个主干节点视图`
      :`显示全部 ${mainNodes.length} 个主干节点（含 ${collapsedTerminalCount} 个折叠末级节点）`;
  };
  $('#densityToggle').onclick=()=>{
    showAllNodes=!showAllNodes;
    hiddenState.clear();
    if(!showAllNodes)hiddenDefault.forEach(id=>hiddenState.add(id));
    if(selected&&hiddenState.has(selected))$('#closeDetail').click();
    syncDensityButton();
    renderCanvas();
    $('#resultCount').textContent=`${displayedMain().length} 个主干节点`;
  };
  syncDensityButton();

  // 可折叠、可拖动工具栏
  const toolbar=$('#floatingToolbar');
  $('#toolbarCollapse').onclick=()=>{
    const collapsed=toolbar.classList.toggle('collapsed');
    $('#toolbarCollapse').innerHTML=`<span aria-hidden="true">${collapsed?'›':'‹'}</span>`;
    $('#toolbarCollapse').setAttribute('aria-label',collapsed?'展开工具栏':'折叠工具栏');
  };
  $('#toolbarDrag').addEventListener('pointerdown',event=>{
    const rect=toolbar.getBoundingClientRect();
    const start={x:event.clientX,y:event.clientY,left:rect.left,top:rect.top};
    toolbar.classList.add('dragging');
    toolbar.style.left=`${rect.left}px`;
    toolbar.style.top=`${rect.top}px`;
    toolbar.style.transform='none';
    event.currentTarget.setPointerCapture(event.pointerId);
    const move=moveEvent=>{
      const left=Math.max(8,Math.min(window.innerWidth-toolbar.offsetWidth-8,start.left+moveEvent.clientX-start.x));
      const top=Math.max(8,Math.min(window.innerHeight-toolbar.offsetHeight-72,start.top+moveEvent.clientY-start.y));
      toolbar.style.left=`${left}px`;
      toolbar.style.top=`${top}px`;
    };
    const handle=event.currentTarget;
    const up=upEvent=>{
      if(handle.hasPointerCapture(event.pointerId))handle.releasePointerCapture(event.pointerId);
      handle.removeEventListener('pointermove',move);
      ['pointerup','pointercancel','lostpointercapture'].forEach(type=>handle.removeEventListener(type,up));
      toolbar.classList.remove('dragging');
    };
    handle.addEventListener('pointermove',move);
    ['pointerup','pointercancel','lostpointercapture'].forEach(type=>handle.addEventListener(type,up));
  });

  // ===== 展览层：封面、导览、方法说明 =====
  const tourStops=[
    {id:'industrial-capitalism',title:'工业资本主义：机器、工厂与积累',
     text:'机器大工业、工厂制度与资本积累确立了现代资本主义的节奏；从这一刻起，劳动、时间与城市都被重新组织。'},
    {id:'early-worker-movement',title:'早期工人运动：第一轮集体回应',
     text:'18 世纪末到 19 世纪中叶，工人为工资、工时与结社权组织起来，为工会与后来的社会主义政党奠定基础。'},
    {id:'marxism',title:'马克思主义：把冲突写进理论',
     text:'历史唯物主义、剩余价值与阶级斗争，为工人运动提供了系统解释；它从此成为后续所有分支的共同参照。'},
    {id:'leninism',title:'列宁主义：帝国主义时代的革命策略',
     text:'先锋队政党、革命策略与国家问题，把马克思主义推进到俄国革命的语境；十月革命后，这条路线成为 20 世纪社会主义的重要模板。'},
    {id:'social-democracy',title:'社会民主主义：另一条道路',
     text:'同一场工人运动也分化出议会改良路线：普选、社会立法与福利国家。它位于社会主义与资本主义制度的交错带上。'},
    {id:'fascism',title:'法西斯主义：反动的现代性',
     text:'极端民族主义、反共与领袖崇拜构成 20 世纪最暴烈的反动传统；现代政治的分岔并不只朝一个方向。'},
    {id:'anticolonial-socialism',title:'反殖民社会主义：第三世界的入场',
     text:'民族独立、国有化与社会改革在亚非拉交汇，路径因国而异；社会主义由此从欧洲内部的争论扩展为全球史。'},
    {id:'platform-capitalism',title:'平台资本主义：当下的延长线',
     text:'数字平台、数据占有与算法治理构成当代资本主义的新形态；它与这次展览所呈现的长时段结构仍属同一段历史。'}
  ];
  let tourIndex=0,tourActive=false,aboutWasOpen=false;
  const fillExhibitionStats=()=>{
    const nodeCount=Object.keys(nodes).length, relCount=relationList.length;
    const sourceCount=Object.keys(D.sources||{}).length, backbone=mainNodes.length;
    const deepCount=Object.values(nodes).filter(node=>node.deepDive).length;
    const bandSpan=bands.length?`${bandName(bands[0])} — ${bandName(bands[bands.length-1])}`:'';
    const chips=[`<span><b>${backbone}</b> 个主干节点</span>`,`<span><b>${nodeCount}</b> 个档案节点</span>`,`<span><b>${relCount}</b> 条关系</span>`,`<span><b>${sourceCount}</b> 条来源</span>`,`<span><b>${deepCount}</b> 条深读</span>`,bandSpan?`<span>${esc(bandSpan)}</span>`:''].join('');
    const introStats=$('#introStats');if(introStats)introStats.innerHTML=chips;
    const aboutStats=$('#aboutStats');
    if(aboutStats)aboutStats.textContent=`当前数据：${backbone} 个主干节点、${nodeCount} 个档案节点、${relCount} 条关系、${sourceCount} 条来源、${deepCount} 条深读；时间范围 ${bandSpan}。`;
  };
  const showIntro=()=>{if(!introOverlay)return;fillExhibitionStats();introOverlay.hidden=false;$('#introEnter').focus();};
  const hideIntro=(remember=true)=>{
    if(!introOverlay)return;introOverlay.hidden=true;
    if(remember){try{sessionStorage.setItem('exhibitIntroSeen','1');}catch(error){}}
  };
  const openAbout=()=>{
    if(!aboutOverlay)return;fillExhibitionStats();
    aboutWasOpen=tourActive;aboutOverlay.hidden=false;$('#closeAbout').focus();
  };
  const closeAbout=()=>{if(aboutOverlay)aboutOverlay.hidden=true;};
  const centerOnNodeInView=id=>{
    const pos=positions[id];if(!pos)return;
    const rect=workspace.getBoundingClientRect();
    const panelWidth=window.innerWidth>980&&detailPanel.classList.contains('visible')?400:0;
    viewport.x=(rect.width-panelWidth)/2-pos.x*viewport.scale;
    viewport.y=rect.height/2-pos.y*viewport.scale;
    applyViewport();
  };
  const goTourStop=index=>{
    if(!tourStops.length)return;
    tourIndex=Math.max(0,Math.min(tourStops.length-1,index));
    const stop=tourStops[tourIndex];
    if(hiddenState.has(stop.id))hiddenState.delete(stop.id);
    if(activeFilter!=='all'||searchQuery){
      activeFilter='all';searchQuery='';
      $$('.filter-chip').forEach(chip=>chip.classList.toggle('active',chip.dataset.filter==='all'));
      const searchBox=$('#globalSearch');if(searchBox)searchBox.value='';
      renderCanvas();
    }
    viewport.scale=Math.min(viewport.maxScale,Math.max(0.82,viewport.scale));
    applyViewport();
    showNodeDetail(stop.id);
    centerOnNodeInView(stop.id);
    $('#tourProgress').textContent=`第 ${tourIndex+1} / ${tourStops.length} 站`;
    $('#tourTitle').textContent=stop.title;
    $('#tourText').textContent=stop.text;
    $('#tourPrev').disabled=tourIndex===0;
    $('#tourNext').textContent=tourIndex===tourStops.length-1?'完成导览':'下一站';
  };
  const startTour=()=>{
    tourActive=true;tourBar.hidden=false;
    document.body.classList.add('tour-open');
    goTourStop(0);
  };
  const endTour=()=>{
    tourActive=false;tourBar.hidden=true;
    document.body.classList.remove('tour-open');
    if($('#detailPanel').classList.contains('visible'))$('#closeDetail').click();
  };
  if($('#introEnter'))$('#introEnter').onclick=()=>hideIntro();
  if($('#introTour'))$('#introTour').onclick=()=>{hideIntro();startTour();};
  if($('#introAbout'))$('#introAbout').onclick=()=>{hideIntro();openAbout();};
  if($('#tourBtn'))$('#tourBtn').onclick=()=>{if(tourActive)endTour();else startTour();};
  if($('#aboutBtn'))$('#aboutBtn').onclick=openAbout;
  if($('#closeAbout'))$('#closeAbout').onclick=closeAbout;
  if(aboutOverlay)aboutOverlay.addEventListener('click',event=>{if(event.target===aboutOverlay)closeAbout();});
  if($('#tourPrev'))$('#tourPrev').onclick=()=>goTourStop(tourIndex-1);
  if($('#tourNext'))$('#tourNext').onclick=()=>{if(tourIndex>=tourStops.length-1)endTour();else goTourStop(tourIndex+1);};
  if($('#tourExit'))$('#tourExit').onclick=endTour;
  if($('#clearFilters'))$('#clearFilters').onclick=()=>{
    activeFilter='all';searchQuery='';
    $$('.filter-chip').forEach(chip=>chip.classList.toggle('active',chip.dataset.filter==='all'));
    const searchBox=$('#globalSearch');if(searchBox)searchBox.value='';
    renderCanvas();
    $('#resultCount').textContent=`${displayedMain().length} 个主干节点`;
  };
  // 首次进入显示封面；?intro=0 跳过，?intro=1 强制显示
  const urlParams=new URLSearchParams(location.search);
  const introParam=urlParams.get('intro');
  // 截图 / 自动化验收用：?motion=0 立即关闭过渡动画
  if(urlParams.get('motion')==='0'){
    const style=document.createElement('style');
    style.textContent='*{animation:none!important;transition:none!important}';
    document.head.appendChild(style);
  }
  let introSeen=false;try{introSeen=sessionStorage.getItem('exhibitIntroSeen')==='1';}catch(error){}
  // 展览封面每次打开都出现（?intro=0 直接进入总图），保证每次参观从封面开始
  if(introParam!=='0')setTimeout(showIntro,80);
  if(urlParams.get('tour')==='1')setTimeout(()=>{hideIntro(false);startTour();},260);
  const deepNode=urlParams.get('node');
  if(deepNode&&byId[deepNode])setTimeout(()=>{
    hideIntro(false);
    if(hiddenState.has(deepNode))hiddenState.delete(deepNode);
    renderCanvas();
    showNodeDetail(deepNode);
    if(urlParams.get('lesson')==='1'&&D.lessons?.[deepNode])openLesson(deepNode);
    if(positions[deepNode]){viewport.scale=Math.min(1,Math.max(0.8,viewport.scale));applyViewport();centerOnNodeInView(deepNode);}
  },300);
  if(urlParams.get('about')==='1')setTimeout(()=>{hideIntro(false);openAbout();},260);
  if(urlParams.get('lessons')==='1')setTimeout(()=>{hideIntro(false);renderLessonIndex();},320);
  const zoomParam=parseFloat(urlParams.get('zoom')||'');
  if(Number.isFinite(zoomParam)&&zoomParam>0)setTimeout(()=>setViewportScale(zoomParam),80);

  // 视图控制
  $('#zoomIn').onclick=()=>zoomBy(0.1);
  $('#zoomOut').onclick=()=>zoomBy(-0.1);
  $('#fitView').onclick=fitView;
  $('#focusSelected').onclick=()=>selected&&centerOnNode(selected);
  $('#resetView').onclick=resetView;
  
  // 画布拖拽：pointerup、pointercancel、lostpointercapture 和窗口失焦都统一收尾。
  let canvasPointerId=null;
  const stopCanvasDrag=event=>{
    if(!viewport.dragging)return;
    viewport.dragging=false;
    workspace.classList.remove('dragging');
    if(canvasPointerId!==null&&workspace.hasPointerCapture(canvasPointerId))workspace.releasePointerCapture(canvasPointerId);
    canvasPointerId=null;
  };
  workspace.addEventListener('pointerdown',event=>{
    if(event.button!==0||event.target.closest('button, input, select, .node-card, .milestone-card'))return;
    event.preventDefault();
    viewport.dragging=true;
    canvasPointerId=event.pointerId;
    workspace.classList.add('dragging');
    viewport.startX=event.clientX-viewport.x;
    viewport.startY=event.clientY-viewport.y;
    workspace.setPointerCapture(event.pointerId);
  });
  workspace.addEventListener('pointermove',event=>{
    if(!viewport.dragging||event.pointerId!==canvasPointerId)return;
    if(!(event.buttons&1))return stopCanvasDrag(event);
    viewport.x=event.clientX-viewport.startX;
    viewport.y=event.clientY-viewport.startY;
    applyViewport();
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>workspace.addEventListener(type,stopCanvasDrag));
  document.addEventListener('pointerup',stopCanvasDrag,true);
  workspace.addEventListener('dragstart',event=>event.preventDefault());
  workspace.addEventListener('selectstart',event=>event.preventDefault());
  window.addEventListener('blur',stopCanvasDrag);
  
  // 滚轮缩放
  workspace.addEventListener('wheel',e=>{
    e.preventDefault();
    const rect=workspace.getBoundingClientRect();
    zoomBy(e.deltaY<0?0.05:-0.05,e.clientX-rect.left,e.clientY-rect.top);
  },{passive:false});

  window.addEventListener('resize',syncAxes);
  
  directoryOverlay.addEventListener('click',event=>{
    if(event.target===directoryOverlay)directoryOverlay.classList.remove('visible');
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){
      if(aboutOverlay&&!aboutOverlay.hidden){closeAbout();return;}
      if(introOverlay&&!introOverlay.hidden){hideIntro();return;}
      if(tourActive){endTour();return;}
      directoryOverlay.classList.remove('visible');
      if(detailPanel.classList.contains('visible'))$('#closeDetail').click();
    }
    if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey){
      event.preventDefault();
      $('#globalSearch').focus();
    }
    if(event.key==='?'&&!event.ctrlKey&&!event.metaKey){
      event.preventDefault();
      if(aboutOverlay&&!aboutOverlay.hidden)closeAbout();else openAbout();
    }
    if(event.key==='+'||event.key==='='){zoomBy(0.1);}
    if(event.key==='-'||event.key==='_'){zoomBy(-0.1);}
    if(event.key==='0'){resetView();}
  });

  // 初始化
  renderAxes();
  renderCanvas();
  $('#resultCount').textContent=`${displayedMain().length} 个主干节点`;
  resetView();
  fillExhibitionStats();
})();
