// Unicode das peças
const UNICODE = {
  wp: '\u2659', wr: '\u2656', wn: '\u2658', wb: '\u2657', wq: '\u2655', wk: '\u2654',
  bp: '\u265F', br: '\u265C', bn: '\u265E', bb: '\u265D', bq: '\u265B', bk: '\u265A'
};

let board = [];
let selected = null; // {r,c}
let turn = 'w';

const boardEl = document.getElementById('board');
const turnEl = document.getElementById('turn');
const resetBtn = document.getElementById('resetBtn');

function createInitialBoard(){
  const emptyRow = ()=>Array(8).fill(null);
  board = [];
  board.push([
    {type:'r',color:'b'},{type:'n',color:'b'},{type:'b',color:'b'},{type:'q',color:'b'},{type:'k',color:'b'},{type:'b',color:'b'},{type:'n',color:'b'},{type:'r',color:'b'}
  ]);
  board.push(Array.from({length:8},()=>({type:'p',color:'b'})));
  for(let i=0;i<4;i++) board.push(emptyRow());
  board.push(Array.from({length:8},()=>({type:'p',color:'w'})));
  board.push([
    {type:'r',color:'w'},{type:'n',color:'w'},{type:'b',color:'w'},{type:'q',color:'w'},{type:'k',color:'w'},{type:'b',color:'w'},{type:'n',color:'w'},{type:'r',color:'w'}
  ]);
  turn='w';
  selected=null;
}

function render(){
  boardEl.innerHTML='';
  for(let r=0;r<8;r++){
    for(let c=0;c<8;c++){
      const sq = document.createElement('div');
      sq.className = 'square ' + (((r+c)%2===0)?'light':'dark');
      sq.dataset.r = r; sq.dataset.c = c;
      const piece = board[r][c];
      if(piece){
        const span = document.createElement('div');
        span.className='piece';
        const key = (piece.color==='w'?'w':'b') + piece.type;
        span.textContent = UNICODE[key];
        sq.appendChild(span);
      }
      sq.addEventListener('click',onSquareClick);
      boardEl.appendChild(sq);
    }
  }
  turnEl.textContent = turn==='w' ? 'Brancas' : 'Pretas';
}

function onSquareClick(e){
  const r = parseInt(e.currentTarget.dataset.r,10);
  const c = parseInt(e.currentTarget.dataset.c,10);
  const clicked = board[r][c];

  if(!selected){
    if(clicked && clicked.color===turn){
      selected = {r,c};
      highlightPossibleMoves(r,c);
    }
    return;
  }
  if(selected.r===r && selected.c===c){
    selected = null;
    clearHighlights();
    return;
  }
  const moves = getLegalMoves(selected.r,selected.c);
  const allowed = moves.some(m=>m.r===r && m.c===c);
  if(allowed){
    makeMove(selected.r,selected.c,r,c);
    selected=null;
    clearHighlights();
  } else {
    if(clicked && clicked.color===turn){
      selected={r,c};
      highlightPossibleMoves(r,c);
    }
  }
}

function clearHighlights(){
  document.querySelectorAll('.square').forEach(s=>{
    s.classList.remove('highlight');
    s.classList.remove('possible')
  });
}

function highlightPossibleMoves(r,c){
  clearHighlights();
  const idx = r*8 + c;
  const squareNodes = boardEl.children;
  squareNodes[idx].classList.add('highlight');
  const moves = getLegalMoves(r,c);
  moves.forEach(m=>{
    const i = m.r*8 + m.c;
    squareNodes[i].classList.add('possible');
  });
}

function inBounds(r,c){return r>=0 && r<8 && c>=0 && c<8}

function getLegalMoves(r,c){
  const piece = board[r][c];
  if(!piece) return [];
  const moves = [];
  const color = piece.color;
  const forward = (color==='w')?-1:1;

  const pushIfEmpty = (rr,cc)=>{ if(inBounds(rr,cc) && !board[rr][cc]) moves.push({r:rr,c:cc}); }
  const pushIfCapture = (rr,cc)=>{ if(inBounds(rr,cc) && board[rr][cc] && board[rr][cc].color!==color) moves.push({r:rr,c:cc}); }

  switch(piece.type){
    case 'p':
      const one = r + forward;
      if(inBounds(one,c) && !board[one][c]){
        moves.push({r:one,c});
        const startRow = (color==='w')?6:1;
        const two = r + forward*2;
        if(r===startRow && inBounds(two,c) && !board[two][c]) moves.push({r:two,c});
      }
      for(const dc of [-1,1]){
        const rr=r+forward, cc=c+dc;
        if(inBounds(rr,cc) && board[rr][cc] && board[rr][cc].color!==color) moves.push({r:rr,c:cc});
      }
      break;
    case 'r': slide(r,c,[[1,0],[-1,0],[0,1],[0,-1]],moves,color); break;
    case 'b': slide(r,c,[[1,1],[1,-1],[-1,1],[-1,-1]],moves,color); break;
    case 'q': slide(r,c,[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],moves,color); break;
    case 'n':
      const deltas = [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
      for(const d of deltas){
        const rr=r+d[0], cc=c+d[1];
        if(inBounds(rr,cc)){
          if(!board[rr][cc] || board[rr][cc].color!==color) moves.push({r:rr,c:cc});
        }
      }
      break;
    case 'k':
      for(let dr=-1;dr<=1;dr++){
        for(let dc=-1;dc<=1;dc++){
          if(dr===0 && dc===0) continue;
          const rr=r+dr, cc=c+dc;
          if(inBounds(rr,cc) && (!board[rr][cc] || board[rr][cc].color!==color)) moves.push({r:rr,c:cc});
        }
      }
      break;
  }
  return moves;
}

function slide(r,c,directions,moves,color){
  for(const d of directions){
    let rr=r+d[0], cc=c+d[1];
    while(inBounds(rr,cc)){
      if(!board[rr][cc]){ moves.push({r:rr,c:cc}); }
      else{ if(board[rr][cc].color!==color) moves.push({r:rr,c:cc}); break; }
      rr+=d[0]; cc+=d[1];
    }
  }
}

function makeMove(r1,c1,r2,c2){
  const piece = board[r1][c1];
  board[r2][c2] = piece;
  board[r1][c1] = null;
  if(piece.type==='p'){
    if((piece.color==='w' && r2===0) || (piece.color==='b' && r2===7)){
      piece.type='q';
    }
  }
  turn = (turn==='w')? 'b' : 'w';
  render();
}

resetBtn.addEventListener('click',()=>{ createInitialBoard(); render(); });

createInitialBoard();
render();
