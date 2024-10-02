from flask import Blueprint, send_from_directory
import os

bp = Blueprint('main', __name__)

MUSIC_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'music')

@bp.route("/")
def index():
    return "Home Page"

@bp.route("/get_songs")
def get_songs():
    songs = [f for f in os.listdir(MUSIC_FOLDER) if f.endswith('.mp3')]
    return {"songs": songs}

@bp.route("/music/<path:filename>")
def serve_music(filename):
    return send_from_directory(MUSIC_FOLDER, filename)