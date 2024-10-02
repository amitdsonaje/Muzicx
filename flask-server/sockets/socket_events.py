from flask_socketio import emit, join_room, leave_room
from .chat import init_chat

rooms = {}

def init_socket(socketio):
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

    # Initialize chat events
    init_chat(socketio)