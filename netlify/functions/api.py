import json
from flask import Flask, Response
from flask_cors import CORS
import sys
import os

# Tambahkan direktori root ke path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import aplikasi Flask dari app.py
try:
    from app import app as flask_app
except ImportError:
    # Jika gagal impor app.py, coba server.py
    try:
        from server import app as flask_app
    except ImportError:
        flask_app = Flask(__name__)
        CORS(flask_app)
        
        @flask_app.route('/')
        def index():
            return {"message": "FACTS API - Netlify Function"}

def handler(event, context):
    """Fungsi handler untuk Netlify serverless function"""
    # Parse path dan method dari event
    path = event.get('path', '/')
    if path.startswith('/.netlify/functions/api'):
        path = path[len('/.netlify/functions/api'):]
    if not path:
        path = '/'
        
    method = event.get('httpMethod', 'GET')
    headers = event.get('headers', {})
    query_params = event.get('queryStringParameters', {}) or {}
    body = event.get('body', '')
    
    # Coba parse JSON body jika ada
    if body and isinstance(body, str):
        try:
            body = json.loads(body)
        except json.JSONDecodeError:
            pass
    
    # Simulasikan request Flask
    with flask_app.test_request_context(
        path=path,
        method=method,
        headers=headers,
        query_string=query_params,
        json=body if isinstance(body, dict) else None,
        data=body if not isinstance(body, dict) else None
    ):
        # Proses request dengan Flask
        response = flask_app.full_dispatch_request()
        
        # Format response untuk Netlify
        return {
            'statusCode': response.status_code,
            'headers': dict(response.headers),
            'body': response.get_data(as_text=True)
        } 