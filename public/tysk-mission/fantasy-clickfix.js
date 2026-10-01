// Robust movement patch: keep field selection independent of XP/ability UI patches.
renderBoard=function(){
  const b=el('board');
  b.innerHTML='';
  const pr=state.pos[0], pc=state.pos[1];
  for(let r=0;r<MAP.length;r++){
    for(let c=0;c<MAP[r].length;c++){
      const ch=MAP[r][c];
      const d=document.createElement('div');
      d.className='cell';
      if(ch==='#') d.classList.add('wall');
      const k=r+','+c;
      const sp=specials[k];
      let icon='';
      if(ch==='S'){d.classList.add('start');icon='🏕️'}
      if(ch==='E'){d.classList.add('exit');icon='🏰'}
      if(sp){d.classList.add(sp.type);icon=sp.icon||icon}
      else if(ch!=='#'&&ch!=='S'&&ch!=='E'&&!state.fieldEvents.has(k)){
        const ft=fieldTypeFor(k);
        d.classList.add(ft==='task'?'puzzle':ft);
        icon=fieldIcon(k);
      }
      if(state.visited.has(k)) d.classList.add('visited');
      if(pr===r&&pc===c){d.classList.add('player');icon='🧭'}
      const adjacent=Math.abs(r-pr)+Math.abs(c-pc)===1;
      if(adjacent&&ch!=='#'){
        d.classList.add('reachable');
        d.onclick=()=>moveTo(r,c);
      }
      d.innerHTML=`${icon||(ch!=='#'?'·':'')}`;
      b.appendChild(d);
    }
  }
};
moveTo=function(r,c){
  const pr=state.pos[0], pc=state.pos[1];
  if(Math.abs(r-pr)+Math.abs(c-pc)!==1) return;
  if(!MAP[r]||MAP[r][c]==='#') return;
  const k=r+','+c;
  state.pos=[r,c];
  state.visited.add(k);
  resolveCell(r,c);
};
// Refresh the board if a game is already visible when this patch loads.
try{ if(document.getElementById('game')&&!document.getElementById('game').classList.contains('hide')) render(); }catch(e){ console.error('clickfix refresh',e); }
