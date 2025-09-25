import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import mend from "./mend.png";
import "./LandingPage.css";

function LandingPage() {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [round, setRound] = useState(3); // default 3 rounds
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }
    if (!round || isNaN(round) || round < 1) {
      alert("Please enter a valid number of rounds");
      return;
    }
    const newRoom = Math.random().toString(36).substr(2, 6).toUpperCase();
    const link = `${window.location.origin}/whiteboard?name=${encodeURIComponent(name)}&room=${newRoom}&rounds=${round}`;
    navigator.clipboard.writeText(link).then(() => {
      alert(`Room created!\nShare this link:\n${link}`);
    });
    navigate(`/whiteboard?name=${encodeURIComponent(name)}&room=${newRoom}&rounds=${round}`);
  };

  const handleJoinRoom = () => {
    if (!name.trim() || !room.trim()) {
      alert("Please enter your name and room code");
      return;
    }
    if (!/^[A-Z0-9]{6}$/.test(room)) {
      alert("Please enter a valid 6-character room code (e.g., AB12CD)");
      return;
    }
    navigate(`/whiteboard?name=${encodeURIComponent(name)}&room=${room}`);
  };

  return (
    <div className="landing-bg">
      {/* Doodle SVG squiggles for background */}
      <svg className="doodle-squiggle doodle-squiggle1" viewBox="0 0 120 60" fill="none"><path d="M10 50 Q 60 10 110 50" stroke="#ffd59e" strokeWidth="6" strokeLinecap="round"/></svg>
      <svg className="doodle-squiggle doodle-squiggle2" viewBox="0 0 140 70" fill="none"><path d="M10 60 Q 70 10 130 60" stroke="#b2cefe" strokeWidth="7" strokeLinecap="round"/></svg>
      <svg className="doodle-squiggle doodle-squiggle3" viewBox="0 0 80 40" fill="none"><path d="M10 30 Q 40 5 70 30" stroke="#b5ead7" strokeWidth="5" strokeLinecap="round"/></svg>
      {/* Pastel doodle SVGs */}
      <svg className="doodle-svg doodle-svg1" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" stroke="#ffb3c6" strokeWidth="4" fill="none"/><circle cx="24" cy="24" r="6" stroke="#b2cefe" strokeWidth="3" fill="none"/></svg>
      <svg className="doodle-svg doodle-svg2" viewBox="0 0 56 56"><rect x="8" y="8" width="40" height="40" rx="10" stroke="#fff5ba" strokeWidth="4" fill="none"/><path d="M16 40 Q28 20 40 40" stroke="#f7b2e6" strokeWidth="3" fill="none"/></svg>
      <svg className="doodle-svg doodle-svg3" viewBox="0 0 36 36"><polygon points="18,4 32,32 4,32" stroke="#c7ceea" strokeWidth="3" fill="none"/></svg>
      <svg className="doodle-svg doodle-svg4" viewBox="0 0 44 44"><ellipse cx="22" cy="22" rx="18" ry="10" stroke="#e2f0cb" strokeWidth="3" fill="none"/></svg>
      <svg className="doodle-svg doodle-svg5" viewBox="0 0 40 40"><path d="M10 30 Q20 10 30 30" stroke="#f6dfeb" strokeWidth="3" fill="none"/><circle cx="20" cy="20" r="3" fill="#ffd59e"/></svg>
      <div className="landing-card">
        <h1 className="landing-title skribbl-title">
          <span className="skrbbl s-red">D</span>
          <span className="skrbbl s-orange">o</span>
          <span className="skrbbl s-yellow">o</span>
          <span className="skrbbl s-green">d</span>
          <span className="skrbbl s-blue">l</span>
          <span className="skrbbl s-cyan">e</span>
          <span className="skrbbl s-purple">W</span>
          <span className="skrbbl s-pink">h</span>
          <span className="skrbbl s-white">a</span>
          <span className="skrbbl s-orange">t</span>
          <span className="skrbbl s-yellow">?</span>
        </h1>
        <div className="landing-image">
          <img src={mend} alt="Mascot" />
        </div>
        <div className="landing-form">
          <input
            className="landing-input"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
          />
          <div className="landing-actions">
            <div className="landing-create">
              <input
                className="landing-input"
                type="number"
                min="1"
                placeholder="Number of rounds (host only)"
                value={round}
                onChange={e => setRound(e.target.value)}
              />
              <button className="landing-btn landing-btn-create" onClick={handleCreateRoom}>
                Create Room
              </button>
            </div>
            <div className="landing-join">
              <input
                className="landing-input"
                type="text"
                placeholder="Room code (if joining)"
                value={room}
                onChange={(e) => setRoom(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <button className="landing-btn landing-btn-join" onClick={handleJoinRoom}>
                Join Room
              </button>
            </div>
          </div>
          <button className="landing-btn landing-btn-disabled" disabled>
            Play Online (Coming Soon)
          </button>
        </div>
      </div>
      
    </div>
  );
}

export default LandingPage;