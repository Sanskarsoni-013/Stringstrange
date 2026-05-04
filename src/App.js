import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import VideoChat from './components/VideoChat';
import LandingPage from './components/LandingPage';
import AnimatedCircleDemo from './components/AnimatedCircleDemo';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/chat" element={<VideoChat />} />
          <Route path="/animated-circle" element={<AnimatedCircleDemo />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;