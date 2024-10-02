from flask_socketio import emit

def init_chat(socketio):
    @socketio.on('send_message')
    def handle_message(data):
        username = data['username']
        room = data['room']
        message = data['message']
        emit('new_message', {'username': username, 'message': message}, room=room)