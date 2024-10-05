import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import "./App.css"

function Room() {
  const { roomId } = useParams();
  const [username, setUsername] = useState('');
  const [joined, setJoined] = useState(false);
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const socketRef = useRef(null);
  const chatContainerRef = useRef(null);
  const seekingRef = useRef(false);
  const syncIntervalRef = useRef(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:5001');

    socketRef.current.on('play_song', (data) => {
      setCurrentSong(data.song);
      setIsPlaying(true);
      setCurrentTime(data.time);
      if (audioRef.current) {
        audioRef.current.src = `http://localhost:5001/music/${data.song}`;
        audioRef.current.currentTime = data.time;
        audioRef.current.play();
      }
    });

    socketRef.current.on('pause_song', (data) => {
      setIsPlaying(false);
      setCurrentTime(data.time);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = data.time;
      }
    });

    socketRef.current.on('resume_song', (data) => {
      setIsPlaying(true);
      setCurrentTime(data.time);
      if (audioRef.current) {
        audioRef.current.currentTime = data.time;
        audioRef.current.play();
      }
    });

    socketRef.current.on('seek_song', (data) => {
      setCurrentTime(data.time);
      if (audioRef.current) {
        audioRef.current.currentTime = data.time;
      }
    });

    socketRef.current.on('sync_time', (data) => {
      if (!seekingRef.current) {
        setCurrentTime(data.time);
        if (audioRef.current && Math.abs(audioRef.current.currentTime - data.time) > 0.5) {
          audioRef.current.currentTime = data.time;
        }
      }
    });

    socketRef.current.on('room_state', (data) => {
      setCurrentSong(data.current_song);
      setIsPlaying(data.is_playing);
      setCurrentTime(data.current_time);
      if (audioRef.current) {
        audioRef.current.src = `http://localhost:5001/music/${data.current_song}`;
        audioRef.current.currentTime = data.current_time;
        if (data.is_playing) {
          audioRef.current.play();
        }
      }
    });

    socketRef.current.on('new_message', (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    return () => {
      socketRef.current.disconnect();
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fetch('http://localhost:5001/get_songs')
      .then(res => res.json())
      .then(data => setSongs(data.songs))
      .catch(err => console.error('Error fetching songs:', err));
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const joinRoom = () => {
    if (username) {
      socketRef.current.emit('join', { username, room: roomId });
      setJoined(true);
      syncIntervalRef.current = setInterval(() => {
        if (audioRef.current && !seekingRef.current) {
          socketRef.current.emit('sync_time', { room: roomId, time: audioRef.current.currentTime });
        }
      }, 1000);
    }
  };

  const leaveRoom = () => {
    socketRef.current.emit('leave', { username, room: roomId });
    setJoined(false);
    setMessages([]);
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
  };

  const playSong = (song) => {
    socketRef.current.emit('play', { room: roomId, song });
  };

  const pauseSong = () => {
    socketRef.current.emit('pause', { room: roomId, time: audioRef.current.currentTime });
  };

  const resumeSong = () => {
    socketRef.current.emit('resume', { room: roomId, time: audioRef.current.currentTime });
  };

  const previousSong = () => {
    const currentIndex = songs.indexOf(currentSong);
    const previousIndex = (currentIndex - 1 + songs.length) % songs.length;
    playSong(songs[previousIndex]);
  };

  const nextSong = () => {
    const currentIndex = songs.indexOf(currentSong);
    const nextIndex = (currentIndex + 1) % songs.length;
    playSong(songs[nextIndex]);
  };

  const handleTimeUpdate = () => {
    if (!seekingRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
    setDuration(audioRef.current.duration);
  };

  const handleSeekStart = () => {
    seekingRef.current = true;
  };

  const handleSeekEnd = () => {
    seekingRef.current = false;
    socketRef.current.emit('seek', { room: roomId, time: currentTime });
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    audioRef.current.currentTime = time;
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socketRef.current.emit('send_message', { username, room: roomId, message: newMessage });
      setNewMessage('');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col">
      {!joined ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="bg-white text-gray-900 p-8 rounded-lg shadow-lg max-w-md w-full">
            <h1 className="text-3xl font-bold mb-6 text-center">Welcome to MusicRoom</h1>
            <input
              type="text"
              className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button
              onClick={joinRoom}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-all text-lg font-semibold"
            >
              Join Room
            </button>
          </div>
        </div>
      ) : (
        <>
          <header className="bg-gray-800 shadow-md">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
              <h1 className="text-3xl font-bold">Welcome to {roomId}</h1>
              <div className="flex items-center space-x-4">
                <span className="text-lg">Hello, {username}!</span>
                <button
                  onClick={leaveRoom}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-md transition-all"
                >
                  Leave Room
                </button>
              </div>
            </div>
          </header>

          <main className="flex-grow container mx-auto px-6 py-8 flex space-x-8">
            <div className="w-1/2 space-y-6">
              <div className="bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">Songs</h2>
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {songs.map((song, index) => (
                    <li
                      key={index}
                      className={`cursor-pointer hover:bg-gray-700 p-3 rounded-md transition-all ${currentSong === song ? 'bg-gray-700' : ''}`}
                      onClick={() => playSong(song)}
                    >
                      {currentSong === song ? '▶ ' : ''}{song}
                    </li>
                  ))}
                </ul>
              </div>

              {currentSong && (
                <div className="bg-gray-800 rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold mb-4">Now Playing: {currentSong}</h3>
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <button
                      onClick={previousSong}
                      className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-all"
                    >
                      <SkipBack size={24} />
                    </button>
                    {isPlaying ? (
                      <button
                        onClick={pauseSong}
                        className="p-2 rounded-full bg-yellow-600 hover:bg-yellow-700 transition-all"
                      >
                        <Pause size={24} />
                      </button>
                    ) : (
                      <button
                        onClick={resumeSong}
                        className="p-2 rounded-full bg-green-600 hover:bg-green-700 transition-all"
                      >
                        <Play size={24} />
                      </button>
                    )}
                    <button
                      onClick={nextSong}
                      className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-all"
                    >
                      <SkipForward size={24} />
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>{formatTime(currentTime)}</span>
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      value={currentTime}
                      onChange={handleSeek}
                      onMouseDown={handleSeekStart}
                      onMouseUp={handleSeekEnd}
                      onTouchStart={handleSeekStart}
                      onTouchEnd={handleSeekEnd}
                      className="w-full"
                    />
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              )}
              <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleTimeUpdate}
              />
            </div>

            <div className="w-1/2 bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Chat</h2>
              <div
                ref={chatContainerRef}
                className="h-96 overflow-y-auto bg-gray-700 p-4 rounded-md space-y-4 mb-4"
              >
                {messages.map((msg, index) => (
                  <div key={index} className={`p-2 rounded-lg ${msg.username === username ? 'bg-blue-600 ml-auto' : 'bg-gray-600'} max-w-xs`}>
                    <p className="font-semibold">{msg.username}</p>
                    <p>{msg.message}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={sendMessage} className="flex space-x-2">
                <input
                  type="text"
                  className="flex-grow px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-all"
                >
                  Send
                </button>
              </form>
            </div>
          </main>
        </>
      )}
    </div>
  );
}

export default Room;