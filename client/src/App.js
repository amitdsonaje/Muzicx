import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

function App() {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');
  const [joined, setJoined] = useState(false);
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const audioRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:5001');

    socketRef.current.on('play_song', (data) => {
      setCurrentSong(data.song);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = `http://localhost:5001/music/${data.song}`;
        audioRef.current.play();
      }
    });

    socketRef.current.on('pause_song', () => {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    });

    socketRef.current.on('resume_song', () => {
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.play();
      }
    });

    socketRef.current.on('new_message', (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    fetch('http://localhost:5001/get_songs')
      .then(res => res.json())
      .then(data => setSongs(data.songs))
      .catch(err => console.error('Error fetching songs:', err));
  }, []);

  const joinRoom = () => {
    if (username && room) {
      socketRef.current.emit('join', { username, room });
      setJoined(true);
    }
  };

  const leaveRoom = () => {
    socketRef.current.emit('leave', { username, room });
    setJoined(false);
    setMessages([]);
  };

  const playSong = (song) => {
    socketRef.current.emit('play', { room, song });
  };

  const pauseSong = () => {
    socketRef.current.emit('pause', { room });
  };

  const resumeSong = () => {
    socketRef.current.emit('resume', { room });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socketRef.current.emit('send_message', { username, room, message: newMessage });
      setNewMessage('');
    }
  };

  return (
    <div className="App">
      {!joined ? (
        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="text"
            placeholder="Room"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      ) : (
        <div>
          <h2>Welcome, {username}!</h2>
          <h3>Room: {room}</h3>
          <button onClick={leaveRoom}>Leave Room</button>
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 1 }}>
              <h3>Songs:</h3>
              <ul>
                {songs.map((song, index) => (
                  <li key={index} onClick={() => playSong(song)}>
                    {song}
                  </li>
                ))}
              </ul>
              {currentSong && (
                <div>
                  <h4>Now Playing: {currentSong}</h4>
                  {isPlaying ? (
                    <button onClick={pauseSong}>Pause</button>
                  ) : (
                    <button onClick={resumeSong}>Resume</button>
                  )}
                </div>
              )}
              <audio ref={audioRef} />
            </div>
            <div style={{ flex: 1 }}>
              <h3>Chat:</h3>
              <div style={{ height: '300px', overflowY: 'scroll', border: '1px solid #ccc' }}>
                {messages.map((msg, index) => (
                  <p key={index}><strong>{msg.username}:</strong> {msg.message}</p>
                ))}
              </div>
              <form onSubmit={sendMessage}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                />
                <button type="submit">Send</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;