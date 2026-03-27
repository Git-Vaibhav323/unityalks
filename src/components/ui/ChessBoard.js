/**
 * Chess board UI: green/black squares; white pieces = filled white, black pieces = white border only.
 * Orientation: amIWhite => white at bottom (row 0 at bottom); !amIWhite => black at bottom (row 7 at bottom).
 */
import React from 'react';
import styled from 'styled-components';
import { createInitialState, getLegalMovesForState, posToCoord, coordToPos } from '../../utils/chessEngine';

const BoardWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 8px;
  position: relative;
`;

/* Strictly square board; glow when it's player's turn */
const BoardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  width: min(88vmin, 420px);
  height: min(88vmin, 420px);
  max-width: 100%;
  max-height: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid #333;
  ${({ $myTurn }) => $myTurn && 'box-shadow: 0 0 24px #1DB954, 0 0 48px rgba(29,185,84,0.4);'}
  transition: box-shadow 0.2s ease;
`;

/* Alternating squares: green fully filled, black fully filled. */
const Cell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  position: relative;
  border: none;

  box-shadow: ${({ $light }) =>
    $light ? 'inset 0 0 0 9999px rgba(34,197,94,0.5)' : 'none'};

  &:hover {
    ${({ $clickable }) => $clickable && 'filter: brightness(1.15);'}
  }
`;

/* White side = solid white. Black side = solid amber/gold with dark outline. Both visible on green & black. */
const PieceSpan = styled.span`
  font-size: clamp(20px, 5.5vw, 30px);
  font-weight: bold;
  user-select: none;
  pointer-events: none;
  line-height: 1;
  ${({ $whiteFilled }) =>
    $whiteFilled
      ? 'color: #ffffff; text-shadow: 0 0 2px #000, 0 0 4px #000, 1px 1px 2px #000, -1px -1px 2px #000;'
      : 'color:rgb(26, 158, 35); -webkit-text-stroke: 1.5pxrgb(10, 12, 16); text-shadow: 0 0 2px #000, 0 0 4px #000, 1px 1px 1px #000;'}
`;

const HighlightDot = styled.div`
  width: 25%;
  height: 25%;
  border-radius: 50%; 
  background: rgba(255,255,255,0.5);
  position: absolute;
`;

const LastMoveHighlight = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(29, 185, 84, 0.35);
  pointer-events: none;
`;

const GameOverText = styled.div`
  margin-top: 10px;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  text-align: center;
`;

const SYMBOLS = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙', k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };

function ChessBoard({ state, amIWhite, onMove, disabled }) {
  const fallbackState = React.useMemo(() => createInitialState(), []);
  const board = state?.board ?? fallbackState.board;
  const turn = state?.turn ?? fallbackState.turn;
  const gameOver = state?.gameOver;
  const lastMove = state?.lastMove;
  const myTurn = (turn === 'white' && amIWhite) || (turn === 'black' && !amIWhite);
  const legalMoves = state ? getLegalMovesForState(state) : [];
  const [selected, setSelected] = React.useState(null);

  const displayRows = amIWhite ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const displayCols = [0, 1, 2, 3, 4, 5, 6, 7];

  const handleCellClick = (row, col) => {
    if (disabled || gameOver) return;
    const pos = coordToPos(row, col);
    const piece = board[row][col];
    const isWhitePiece = piece && piece === piece.toUpperCase() && piece !== '';
    const isBlackPiece = piece && piece === piece.toLowerCase();
    const isMine = (amIWhite && isWhitePiece) || (!amIWhite && isBlackPiece);

    if (selected) {
      const fromPos = coordToPos(selected.row, selected.col);
      let move = legalMoves.find((m) => m.from === fromPos && m.to === pos && (m.promotion === 'Q' || !m.promotion));
      if (!move) move = legalMoves.find((m) => m.from === fromPos && m.to === pos);
      if (move) {
        onMove({ from: move.from, to: move.to, promotion: move.promotion || undefined });
        setSelected(null);
        return;
      }
      if (isMine) {
        setSelected({ row, col });
        return;
      }
      setSelected(null);
      return;
    }
    if (myTurn && isMine) setSelected({ row, col });
  };

  const isLegalTarget = (row, col) => {
    if (!selected) return false;
    const fromPos = coordToPos(selected.row, selected.col);
    const toPos = coordToPos(row, col);
    return legalMoves.some((m) => m.from === fromPos && m.to === toPos);
  };

  const isLastMoveSquare = (row, col) => {
    if (!lastMove) return false;
    const from = posToCoord(lastMove.from);
    const to = posToCoord(lastMove.to);
    return (from && from.row === row && from.col === col) || (to && to.row === row && to.col === col);
  };

  let gameOverText = null;
  if (gameOver === 'draw') gameOverText = 'Draw';
  else if (gameOver === 'white') gameOverText = 'White wins';
  else if (gameOver === 'black') gameOverText = 'Black wins';

  return (
    <BoardWrap>
      <BoardGrid $myTurn={!gameOver && myTurn}>
        {displayRows.map((row) =>
          displayCols.map((col) => {
            const piece = board[row][col];
            const light = (row + col) % 2 === 1;
            const clickable = !disabled && ((myTurn && piece && ((amIWhite && piece === piece.toUpperCase()) || (!amIWhite && piece === piece.toLowerCase()))) || (selected && isLegalTarget(row, col)));
            const showDot = selected && isLegalTarget(row, col) && !piece;
            const showCaptureDot = selected && isLegalTarget(row, col) && piece;
            const whiteFilled = piece ? piece === piece.toUpperCase() : true;

            return (
              <Cell
                key={`${row}-${col}`}
                $light={light}
                $clickable={clickable}
                onClick={() => handleCellClick(row, col)}
              >
                {isLastMoveSquare(row, col) && <LastMoveHighlight />}
                {showDot && <HighlightDot />}
                {showCaptureDot && <LastMoveHighlight />}
                {piece && (
                  <PieceSpan $whiteFilled={whiteFilled}>
                    {SYMBOLS[piece] || piece}
                  </PieceSpan>
                )}
              </Cell>
            );
          })
        )}
      </BoardGrid>
      {gameOverText && <GameOverText>{gameOverText}</GameOverText>}
    </BoardWrap>
  );
}

export default ChessBoard;
