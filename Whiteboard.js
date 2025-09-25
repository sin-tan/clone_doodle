import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import './Whiteboard.css';

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const socketRef = useRef();
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(2);
  const [isEraser, setIsEraser] = useState(false);
  const [history, setHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [drawer, setDrawer] = useState(null);
  const [wordToGuess, setWordToGuess] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [timer, setTimer] = useState(30);
  const [roundsLeft, setRoundsLeft] = useState(null);
  const [rounds, setRounds] = useState(null); // NEW: store rounds from URL
  const [gameStarted, setGameStarted] = useState(false); // NEW
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winnerText, setWinnerText] = useState('');

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const room = params.get('room');
  const name = params.get('name');
  const roundsParam = params.get('rounds'); // NEW

  const handleCopy = () => {
    navigator.clipboard.writeText(room)
      .then(() => alert('✅ Room code copied!'))
      .catch(() => alert('❌ Failed to copy code'));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 800;
    canvas.height = 600;
    const context = canvas.getContext('2d');
    context.lineCap = 'round';

    // Dynamic Socket.IO URL - works for both development and production
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 
                     (process.env.NODE_ENV === 'production' ? 
                      'https://your-backend-url.com' : 
                      'http://localhost:5000');
    
    socketRef.current = io(socketUrl);
    socketRef.current.emit('join-room', { roomId: room, name });

    socketRef.current.on('drawing', (data) => {
      drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.size, false);
    });

    socketRef.current.on('clear', () => {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    });

    socketRef.current.on('user-list', (userList) => {
      setUsers(userList);
    });

    socketRef.current.on('user-joined', (userName) => {
      setChatMessages(prev => [...prev, { name: '🟢 System', message: `${userName} joined.` }]);
    });

    socketRef.current.on('user-left', (userName) => {
      setChatMessages(prev => [...prev, { name: '🔴 System', message: `${userName} left.` }]);
    });

    socketRef.current.on('receive-message', ({ message, name }) => {
      setChatMessages(prev => [...prev, { message, name }]);
    });

    socketRef.current.on('correct-guess', ({ guesser }) => {
      //setChatMessages(prev => [...prev, { name: , message: ` ` }]);
      // Do NOT clear setWordToGuess here; keep showing the word to the drawer until the round ends
    });

    socketRef.current.on('game-started', ({ drawerName, wordHint, roundsLeft, realWord }) => {
      setDrawer(drawerName);
      setRoundsLeft(roundsLeft);
      setGameStarted(true);
      setTimer(30); // Reset timer immediately
      setShowWinnerModal(false); // Hide winner modal on new game
      //setChatMessages(prev => [...prev, { name: '🟢 System', message: `${drawerName} is now drawing.` }]);
      if (drawerName === name) {
        setWordToGuess(realWord); // Show the real word to the drawer
      } else {
        setWordToGuess(wordHint); // Show the hint to others
      }
    });

    socketRef.current.on('your-word', (word) => {
      if (drawer === name) setWordToGuess(word); // Update to real word if received
    });

    socketRef.current.on('hint', ({ hint }) => {
      setWordToGuess(hint); // Already formatted by backend
    });

    socketRef.current.on('timer', (value) => {
      setTimer(value);
    });

    socketRef.current.on('game-ended', ({ message }) => {
      setChatMessages(prev => [...prev, { name: '🏁 Game', message }]);
      setDrawer(null);
      setWordToGuess(''); // Only clear the word when the round/game ends
      setRoundsLeft(null);
      // Winner logic
      if (users.length > 0) {
        const maxScore = Math.max(...users.map(u => u.score || 0));
        const winners = users.filter(u => (u.score || 0) === maxScore);
        if (winners.length === 1) {
          setWinnerText(`🏆 Winner: ${winners[0].name} (${maxScore} points)`);
        } else {
          setWinnerText(`🤝 It's a tie! (${maxScore} points)`);
        }
        setShowWinnerModal(true);
      }
    });

    socketRef.current.on('set-host', () => {
      setIsHost(true);
    });

    return () => socketRef.current.disconnect();
  }, [room, name]);

  useEffect(() => {
    // Remove auto-start logic
  }, []);

  const drawLine = (x0, y0, x1, y1, strokeColor, strokeSize, emit) => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeSize;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.closePath();

    if (!emit) return;
    socketRef.current.emit('drawing', {
      x0, y0, x1, y1,
      color: strokeColor,
      size: strokeSize,
      room
    });
  };

  const handleMouseDown = (e) => {
    if (drawer !== name) return;
    canvasRef.current.isDrawing = true;
    canvasRef.current.lastX = e.nativeEvent.offsetX;
    canvasRef.current.lastY = e.nativeEvent.offsetY;
  };

  const handleMouseUp = () => {
    canvasRef.current.isDrawing = false;
    saveHistory();
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current.isDrawing || drawer !== name) return;
    const newX = e.nativeEvent.offsetX;
    const newY = e.nativeEvent.offsetY;
    const drawColor = isEraser ? '#FFFFFF' : color;
    drawLine(canvasRef.current.lastX, canvasRef.current.lastY, newX, newY, drawColor, size, true);
    canvasRef.current.lastX = newX;
    canvasRef.current.lastY = newY;
  };

  const saveHistory = () => {
    const canvas = canvasRef.current;
    setHistory(prev => [...prev, canvas.toDataURL()]);
  };

  const handleClear = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    socketRef.current.emit('clear', room);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const ctx = canvasRef.current.getContext('2d');
    const img = new Image();
    img.src = history[history.length - 1];
    img.onload = () => {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(img, 0, 0);
      setHistory(history.slice(0, -1));
    };
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    socketRef.current.emit('send-message', { room, message: newMessage, name });
    setNewMessage('');
  };

  return (
    <div className="wb-root">
      {/* Left Panel */}
      <div className="wb-sidebar">
        <h3 className="wb-section-title">👥 Users</h3>
        <ul className="wb-user-list">
          {users.map(user => (
            <li key={user.id} className="wb-user">👤 {user.name} ({user.score || 0})</li>
          ))}
        </ul>
        {isHost && !gameStarted && (
          <button className="wb-btn wb-btn-start" onClick={() => {
            const rounds = parseInt(roundsParam, 10);
            if (isNaN(rounds) || rounds <= 0) {
              alert('Please provide a valid number of rounds (e.g., ?rounds=3 in URL)');
              return;
            }
            socketRef.current.emit('start-game', { roomId: room, rounds });
          }}>
            🎮 Start Game
          </button>
        )}
        {gameStarted && roundsLeft !== null && <p className="wb-info">🕹️ Round Left: {roundsLeft}</p>}
        {gameStarted && <p className="wb-info">⏱️ Timer: {timer}s</p>}
      </div>

      {/* Whiteboard Canvas */}
      <div className="wb-main">
        <div className="wb-header">
          <h3 className="wb-joined">Joined as: <span>{name}</span></h3>
          <p className="wb-room">Room: <strong>{room}</strong> <button className="wb-btn wb-btn-copy" onClick={handleCopy}>📋</button></p>
          <p className="wb-drawer">Drawer: <strong>{drawer || 'Waiting...'}</strong></p>
          {gameStarted && (drawer === name ? (
            <p className="wb-word">Word to draw: <code>{wordToGuess}</code></p>
          ) : (
            <p className="wb-word">Word: <code>{wordToGuess}</code></p>
          ))}
          {!gameStarted && <p className="wb-waiting">Waiting for host to start the game...</p>}
        </div>
        <div className="wb-toolbar">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} disabled={isEraser} className="wb-color-picker" />
          <input type="range" min="1" max="10" value={size} onChange={(e) => setSize(e.target.value)} className="wb-range" />
          <button className="wb-btn wb-btn-tool" onClick={() => setIsEraser(!isEraser)}>{isEraser ? '✏️ Pen' : '🧽 Eraser'}</button>
          <button className="wb-btn wb-btn-tool" onClick={handleClear}>🗑️ Clear</button>
          <button className="wb-btn wb-btn-tool" onClick={handleUndo}>↩️ Undo</button>
        </div>
        <canvas
          ref={canvasRef}
          className="wb-canvas"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseOut={handleMouseUp}
          onMouseMove={handleMouseMove}
        />
      </div>

      {/* Chat Panel */}
      <div className="wb-chat-panel">
        <h3 className="wb-section-title">💬 Chat</h3>
        <div className="wb-chat-messages">
          {chatMessages.map((msg, i, arr) => {
            if (
              i > 0 &&
              msg.name === arr[i - 1].name &&
              msg.message === arr[i - 1].message
            ) {
              return null;
            }
            return (
              <div key={i} className="wb-chat-message"><strong>{msg.name}:</strong> {msg.message}</div>
            );
          })}
        </div>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={drawer !== name ? 'Guess...' : 'You are drawing...'}
          className="wb-chat-input"
        />
        <button className="wb-btn wb-btn-chat" onClick={handleSendMessage}>Send</button>
      </div>

      {/* Winner Modal Overlay */}
      {showWinnerModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '16px',
            padding: '40px 60px',
            boxShadow: '0 4px 32px rgba(0,0,0,0.2)',
            textAlign: 'center',
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#222'
          }}>
            {winnerText}
            <br/>
            <button style={{marginTop: '2rem', fontSize: '1.2rem', padding: '0.5em 2em', borderRadius: '8px', border: 'none', background: '#007bff', color: '#fff', cursor: 'pointer'}} onClick={() => setShowWinnerModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Whiteboard;