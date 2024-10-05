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
            rooms[room] = {"users": set(), "current_song": None, "is_playing": False, "current_time": 0}
        rooms[room]["users"].add(username)
        emit('user_joined', {'username': username}, room=room)
        # Send current room state to the new user
        emit('room_state', {
            'current_song': rooms[room]["current_song"],
            'is_playing': rooms[room]["is_playing"],
            'current_time': rooms[room]["current_time"]
        })

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
        rooms[room]["current_time"] = 0
        emit('play_song', {'song': song, 'time': 0}, room=room)

    @socketio.on('pause')
    def on_pause(data):
        room = data['room']
        time = data['time']
        rooms[room]["is_playing"] = False
        rooms[room]["current_time"] = time
        emit('pause_song', {'time': time}, room=room)

    @socketio.on('resume')
    def on_resume(data):
        room = data['room']
        time = data['time']
        rooms[room]["is_playing"] = True
        rooms[room]["current_time"] = time
        emit('resume_song', {'time': time}, room=room)

    @socketio.on('seek')
    def on_seek(data):
        room = data['room']
        time = data['time']
        rooms[room]["current_time"] = time
        emit('seek_song', {'time': time}, room=room)

    @socketio.on('sync_time')
    def on_sync_time(data):
        room = data['room']
        time = data['time']
        rooms[room]["current_time"] = time
        emit('sync_time', {'time': time}, room=room, include_sender=False)

    # Initialize chat events
    init_chat(socketio)