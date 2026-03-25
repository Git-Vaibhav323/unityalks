/**
 * Chess engine: full rules, move generation, check/checkmate, castling, en passant, promotion.
 * Board: 8x8, board[row][col]. White = uppercase (RNBQKP), black = lowercase (rnbqkp). Row 0 = white back rank.
 */

const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

function posToCoord(sq) {
  if (!sq || sq.length !== 2) return null;
  const col = FILES.indexOf(sq[0]);
  const row = RANKS.indexOf(sq[1]);
  if (col < 0 || row < 0) return null;
  return { row, col };
}
function coordToPos(r, c) {
  if (r < 0 || r > 7 || c < 0 || c > 7) return null;
  return FILES[c] + RANKS[r];
}

function copyBoard(board) {
  return board.map((row) => [...row]);
}

function getInitialBoard() {
  // Row 0 = white back rank, row 1 = white pawns, row 6 = black pawns, row 7 = black back rank
  return [
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ];
}

function isWhite(piece) {
  return piece && piece === piece.toUpperCase() && piece !== '';
}
function isBlack(piece) {
  return piece && piece === piece.toLowerCase();
}
function findKing(board, whiteTurn) {
  const k = whiteTurn ? 'K' : 'k';
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c] === k) return { row: r, col: c };
  return null;
}

function isInCheck(board, whiteTurn) {
  const king = findKing(board, whiteTurn);
  if (!king) return false;
  const enemy = whiteTurn ? isBlack : isWhite;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (enemy(board[r][c]) && canAttack(board, r, c, king.row, king.col, whiteTurn))
        return true;
    }
  }
  return false;
}

function canAttack(board, fromR, fromC, toR, toC, whiteTurn) {
  const piece = board[fromR][fromC];
  if (!piece) return false;
  const pieceLower = piece.toLowerCase();
  const dr = toR - fromR;
  const dc = toC - fromC;
  if (pieceLower === 'p') {
    const dir = whiteTurn ? 1 : -1;
    if (dc === 0) return false;
    return toR === fromR + dir && Math.abs(dc) === 1;
  }
  if (pieceLower === 'n') {
    return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
  }
  if (pieceLower === 'k') {
    return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
  }
  if (pieceLower === 'r' || pieceLower === 'b' || pieceLower === 'q') {
    const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
    const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
    if (pieceLower === 'b' && stepR !== 0 && stepC !== 0 && Math.abs(dr) === Math.abs(dc)) {}
    else if (pieceLower === 'r' && (stepR === 0 || stepC === 0)) {}
    else if (pieceLower === 'q' && (stepR === 0 || stepC === 0 || Math.abs(dr) === Math.abs(dc))) {}
    else return false;
    let r = fromR + stepR;
    let c = fromC + stepC;
    while (r !== toR || c !== toC) {
      if (r < 0 || r > 7 || c < 0 || c > 7 || board[r][c]) return false;
      r += stepR;
      c += stepC;
    }
    return true;
  }
  return false;
}

function getPawnMoves(board, r, c, whiteTurn, enPassantTarget) {
  const moves = [];
  const dir = whiteTurn ? 1 : -1; // white moves toward row 7, black toward row 0
  const startRow = whiteTurn ? 1 : 6;
  const promoRow = whiteTurn ? 7 : 0;
  if (r + dir >= 0 && r + dir <= 7) {
    if (!board[r + dir][c]) {
      if (r + dir === promoRow) {
        ['Q', 'R', 'B', 'N'].forEach((prom) => moves.push({ from: coordToPos(r, c), to: coordToPos(r + dir, c), promotion: prom }));
      } else {
        moves.push({ from: coordToPos(r, c), to: coordToPos(r + dir, c) });
      }
      if (r === startRow && !board[r + 2 * dir][c]) {
        moves.push({ from: coordToPos(r, c), to: coordToPos(r + 2 * dir, c) });
      }
    }
    for (const dc of [-1, 1]) {
      const nc = c + dc;
      if (nc < 0 || nc > 7) continue;
      const target = board[r + dir][nc];
      if (target && (whiteTurn ? isBlack(target) : isWhite(target))) {
        if (r + dir === promoRow) {
          ['Q', 'R', 'B', 'N'].forEach((prom) => moves.push({ from: coordToPos(r, c), to: coordToPos(r + dir, nc), promotion: prom }));
        } else {
          moves.push({ from: coordToPos(r, c), to: coordToPos(r + dir, nc) });
        }
      }
      if (enPassantTarget && coordToPos(r + dir, nc) === enPassantTarget) {
        moves.push({ from: coordToPos(r, c), to: coordToPos(r + dir, nc), enPassant: true });
      }
    }
  }
  return moves;
}

function getSlidingMoves(board, r, c, whiteTurn, directions) {
  const moves = [];
  for (const [dr, dc] of directions) {
    let nr = r + dr;
    let nc = c + dc;
    while (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
      const target = board[nr][nc];
      if (!target) {
        moves.push({ from: coordToPos(r, c), to: coordToPos(nr, nc) });
      } else {
        if (whiteTurn ? isBlack(target) : isWhite(target)) moves.push({ from: coordToPos(r, c), to: coordToPos(nr, nc) });
        break;
      }
      nr += dr;
      nc += dc;
    }
  }
  return moves;
}

function getKnightMoves(board, r, c, whiteTurn) {
  const moves = [];
  const jumps = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  for (const [dr, dc] of jumps) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
    const target = board[nr][nc];
    if (!target || (whiteTurn ? isBlack(target) : isWhite(target)))
      moves.push({ from: coordToPos(r, c), to: coordToPos(nr, nc) });
  }
  return moves;
}

function getKingMoves(board, r, c, whiteTurn, castling) {
  const moves = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
      const target = board[nr][nc];
      if (!target || (whiteTurn ? isBlack(target) : isWhite(target)))
        moves.push({ from: coordToPos(r, c), to: coordToPos(nr, nc) });
    }
  if (castling) {
    const back = whiteTurn ? 0 : 7;
    if (r === back && c === 4) {
      if ((whiteTurn ? castling.K : castling.k) && !board[back][5] && !board[back][6]) {
        const piece = board[back][7];
        if (piece && (whiteTurn ? piece === 'R' : piece === 'r'))
          moves.push({ from: 'e' + RANKS[back], to: 'g' + RANKS[back], castling: 'k' });
      }
      if ((whiteTurn ? castling.Q : castling.q) && !board[back][1] && !board[back][2] && !board[back][3]) {
        const piece = board[back][0];
        if (piece && (whiteTurn ? piece === 'R' : piece === 'r'))
          moves.push({ from: 'e' + RANKS[back], to: 'c' + RANKS[back], castling: 'q' });
      }
    }
  }
  return moves;
}

function getPseudoLegalMoves(board, whiteTurn, enPassantTarget, castling) {
  const moves = [];
  const isMine = whiteTurn ? isWhite : isBlack;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!isMine(piece)) continue;
      const pl = piece.toLowerCase();
      if (pl === 'p') moves.push(...getPawnMoves(board, r, c, whiteTurn, enPassantTarget));
      else if (pl === 'r') moves.push(...getSlidingMoves(board, r, c, whiteTurn, [[0, 1], [0, -1], [1, 0], [-1, 0]]));
      else if (pl === 'b') moves.push(...getSlidingMoves(board, r, c, whiteTurn, [[1, 1], [1, -1], [-1, 1], [-1, -1]]));
      else if (pl === 'q') moves.push(...getSlidingMoves(board, r, c, whiteTurn, [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]));
      else if (pl === 'n') moves.push(...getKnightMoves(board, r, c, whiteTurn));
      else if (pl === 'k') moves.push(...getKingMoves(board, r, c, whiteTurn, castling));
    }
  }
  return moves;
}

function applyMoveToBoard(board, move) {
  const next = copyBoard(board);
  const from = posToCoord(move.from);
  const to = posToCoord(move.to);
  if (!from || !to) return null;
  const piece = next[from.row][from.col];
  next[from.row][from.col] = '';
  if (move.enPassant) {
    const capRow = to.row + (piece === 'P' ? -1 : 1);
    next[capRow][to.col] = '';
  }
  if (move.castling) {
    const back = piece === 'K' ? 0 : 7;
    if (move.castling === 'k') {
      next[back][7] = '';
      next[back][5] = piece === 'K' ? 'R' : 'r';
    } else {
      next[back][0] = '';
      next[back][3] = piece === 'K' ? 'R' : 'r';
    }
  }
  next[to.row][to.col] = move.promotion ? (piece === 'P' ? move.promotion : move.promotion.toLowerCase()) : piece;
  return next;
}

function getLegalMoves(board, whiteTurn, enPassantTarget, castling) {
  const pseudo = getPseudoLegalMoves(board, whiteTurn, enPassantTarget, castling);
  const legal = [];
  for (const move of pseudo) {
    const next = applyMoveToBoard(board, move);
    if (next && !isInCheck(next, whiteTurn)) legal.push(move);
  }
  return legal;
}

function updateCastling(castling, board, from, to) {
  const next = { ...castling };
  const fromCoord = posToCoord(from);
  if (!fromCoord) return next;
  const piece = board[fromCoord.row][fromCoord.col];
  const pl = piece ? piece.toLowerCase() : '';
  if (pl === 'k') {
    if (piece === 'K') next.K = next.Q = false;
    else next.k = next.q = false;
  }
  if (pl === 'r') {
    if (from === 'a1') next.Q = false;
    if (from === 'h1') next.K = false;
    if (from === 'a8') next.q = false;
    if (from === 'h8') next.k = false;
  }
  if (to === 'a1') next.Q = false;
  if (to === 'h1') next.K = false;
  if (to === 'a8') next.q = false;
  if (to === 'h8') next.k = false;
  return next;
}

function getEnPassantTarget(board, move, whiteTurn) {
  const piece = board[posToCoord(move.from).row][posToCoord(move.from).col];
  if (piece && piece.toLowerCase() !== 'p') return null;
  const from = posToCoord(move.from);
  const to = posToCoord(move.to);
  if (Math.abs(from.row - to.row) === 2) {
    const midRow = (from.row + to.row) / 2;
    return coordToPos(midRow, from.col);
  }
  return null;
}

export function createInitialState() {
  return {
    board: getInitialBoard().map((r) => [...r]),
    turn: 'white',
    enPassantTarget: null,
    castling: { K: true, Q: true, k: true, q: true },
    gameOver: null,
    lastMove: null,
  };
}

export function applyMove(state, move) {
  const { board, turn, enPassantTarget, castling } = state;
  const whiteTurn = turn === 'white';
  const legal = getLegalMoves(board, whiteTurn, enPassantTarget, castling);
  const valid = legal.find((m) => m.from === move.from && m.to === move.to && (m.promotion || '') === (move.promotion || ''));
  if (!valid) return null;
  const nextBoard = applyMoveToBoard(board, valid);
  if (!nextBoard || isInCheck(nextBoard, whiteTurn)) return null;
  const nextTurn = whiteTurn ? 'black' : 'white';
  const nextEp = getEnPassantTarget(board, valid, whiteTurn);
  const nextCastling = updateCastling(castling, board, valid.from, valid.to);
  const nextState = {
    board: nextBoard,
    turn: nextTurn,
    enPassantTarget: nextEp,
    castling: nextCastling,
    lastMove: valid,
    gameOver: null,
  };
  const inCheck = isInCheck(nextBoard, nextTurn === 'white');
  const legalNext = getLegalMoves(nextBoard, nextTurn === 'white', nextEp, nextCastling);
  if (legalNext.length === 0) {
    nextState.gameOver = inCheck ? (nextTurn === 'white' ? 'black' : 'white') : 'draw';
  }
  return nextState;
}

export function getLegalMovesForState(state) {
  const whiteTurn = state.turn === 'white';
  return getLegalMoves(state.board, whiteTurn, state.enPassantTarget, state.castling);
}

export function isCheck(state) {
  return isInCheck(state.board, state.turn === 'white');
}

export function isCheckmate(state) {
  return state.gameOver && state.gameOver !== 'draw';
}

export function isDraw(state) {
  return state.gameOver === 'draw';
}

export { getInitialBoard, posToCoord, coordToPos, RANKS, FILES };
