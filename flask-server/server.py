# from flask import Flask
# from flask_cors import CORS 

# app = Flask(__name__)
# CORS(app)

# # Members API route
# @app.route("/members")
# def members():
#     return {"members": ["member1","member2","member3"]}

# if __name__ == "__main__":
#     app.run(debug=True, port=5001)
from flask import Flask, request, send_from_directory
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

rooms = {}
MUSIC_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'music')

@app.route("/get_songs")
def get_songs():
    songs = [f for f in os.listdir(MUSIC_FOLDER) if f.endswith('.mp3')]
    return {"songs": songs}

@app.route("/music/<path:filename>")
def serve_music(filename):
    return send_from_directory(MUSIC_FOLDER, filename)

@socketio.on('join')
def on_join(data):
    username = data['username']
    room = data['room']
    join_room(room)
    if room not in rooms:
        rooms[room] = {"users": set(), "current_song": None, "is_playing": False}
    rooms[room]["users"].add(username)
    emit('user_joined', {'username': username}, room=room)

@socketio.on('leave')
def on_leave(data):
    username = data['username']
    room = data['room']
    leave_room(room)
    rooms[room]["users"].remove(username)
    emit('user_left', {'username': username}, room=room)

@socketio.on('play')
def on_play(data):
    room = data['room']
    song = data['song']
    rooms[room]["current_song"] = song
    rooms[room]["is_playing"] = True
    emit('play_song', {'song': song}, room=room)

@socketio.on('pause')
def on_pause(data):
    room = data['room']
    rooms[room]["is_playing"] = False
    emit('pause_song', room=room)

@socketio.on('resume')
def on_resume(data):
    room = data['room']
    rooms[room]["is_playing"] = True
    emit('resume_song', room=room)

if __name__ == "__main__":
    socketio.run(app, debug=True, port=5001)