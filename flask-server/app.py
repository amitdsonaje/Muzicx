from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Import routes and sockets
from routes import main_routes
from sockets import socket_events

# Register blueprints
app.register_blueprint(main_routes.bp)

# Initialize socket events
socket_events.init_socket(socketio)

if __name__ == "__main__":
    socketio.run(app, debug=True, port=5001)