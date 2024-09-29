// import React, {useState, useEffect } from 'react'

//    function App(){
//      const [data, setData] = useState([{}])
//      const [error, setError] = useState(null)

//      useEffect(() => {
//        fetch("http://localhost:5001/members")
//          .then(res => {
//            if (!res.ok) {
//              throw new Error(`HTTP error! status: ${res.status}`);
//            }
//            return res.json();
//          })
//          .then(data => {
//            setData(data)
//            console.log("Data received:", data)
//          })
//          .catch(e => {
//            console.error("Fetch error:", e)
//            setError(e.message)
//          })
//      }, [])

//      return (
//        <div>
//          {error && <p>Error: {error}</p>}
//          {data.members && (
//            <ul>
//              {data.members.map((member, index) => (
//                <li key={index}>{member}</li>
//              ))}
//            </ul>
//          )}
//        </div>
//      )
//    }

//    export default App
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

function App() {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');
  const [joined, setJoined] = useState(false);
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
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
      )}
    </div>
  );
}

export default App;