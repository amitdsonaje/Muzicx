import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [room, setRoom] = useState('');
  const navigate = useNavigate();

  const joinRoom = () => {
    if (room) {
      navigate(`/room/${room}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 bg-blue-300 rounded-lg shadow-xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Join a Room</h1>
      <input
        type="text"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Room Name"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
      />
      <button
        onClick={joinRoom}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md transition-all"
      >
        Join Room
      </button>
    </div>
  );
}

export default Home;
