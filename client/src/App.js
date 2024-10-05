import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Room from './Room';
import Home from './Home';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center justify-center">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:roomId" element={<Room />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
