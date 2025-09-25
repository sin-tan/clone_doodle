import React from 'react';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import Whiteboard from './Whiteboard';

function App() {
  return (
    <Router>
      <Routes>
       <Route path="/" element={<LandingPage />} />
<Route path="/whiteboard" element={<Whiteboard />} />

      </Routes>
    </Router>
  );
}

export default App; 
