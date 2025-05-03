from flask import Flask, request, jsonify
from datetime import datetime
import json
import os
import logging
import traceback
import configparser
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import platform
# Tambahan untuk YOLO
import torch
import base64
import cv2
import numpy as np
from pathlib import Path
import time
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Enable CORS for all routes with any origin

# Konfigurasi logging yang lebih detail
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Coba membaca konfigurasi dari file .env atau config.ini jika ada
try:
    config = configparser.ConfigParser()
    if os.path.exists('config.ini'):
        config.read('config.ini')
        logger.info("Berhasil membaca file konfigurasi")
    else:
        logger.warning("File konfigurasi tidak ditemukan, menggunakan nilai default")
except Exception as e:
    logger.error(f"Gagal membaca konfigurasi: {str(e)}")
    config = configparser.ConfigParser()

# Path penyimpanan data (absolute path)
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
SENSOR_FILE = os.path.join(DATA_DIR, "sensor_data.json")
CV_FILE = os.path.join(DATA_DIR, "cv_activity.json")

# Konfigurasi untuk YOLO
MODEL_DIR = os.path.join(BASE_DIR, "models")
AVAILABLE_MODELS = {
    "sapi": os.path.join(MODEL_DIR, "sapi.pt"),
    "ayam": os.path.join(MODEL_DIR, "ayam.pt"),
    "kambing": os.path.join(MODEL_DIR, "kambing.pt")
}

# Load YOLO models on demand
yolo_models = {}

# Buat direktori data jika belum ada
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)

# Inisialisasi file kosong jika belum ada
for path in [SENSOR_FILE, CV_FILE]:
    if not os.path.exists(path):
        with open(path, "w") as f:
            json.dump([], f)
        logger.info(f"Created new file: {path}")

# Konfigurasi MongoDB
# Gunakan nama database dari config.ini (DATABASE section) dengan fallback ke nilai default
MONGO_ENABLED = config.getboolean('MONGO', 'enabled', fallback=False) if 'MONGO' in config else \
                config.getboolean('DATABASE', 'enabled', fallback=False) if 'DATABASE' in config else False

MONGO_URI = config.get('MONGO', 'uri', fallback="mongodb://localhost:27017/") if 'MONGO' in config else \
            config.get('DATABASE', 'mongodb_uri', fallback="mongodb://localhost:27017/") if 'DATABASE' in config else "mongodb://localhost:27017/"

MONGO_DB = config.get('MONGO', 'db', fallback="facts_data") if 'MONGO' in config else \
           config.get('DATABASE', 'db_name', fallback="facts_data") if 'DATABASE' in config else "facts_data"

MONGO_SENSOR_COLLECTION = config.get('MONGO', 'sensor_collection', fallback="sensor_data") if 'MONGO' in config else \
                          config.get('DATABASE', 'sensor_collection', fallback="sensor_data") if 'DATABASE' in config else "sensor_data"

MONGO_CV_COLLECTION = config.get('MONGO', 'cv_collection', fallback="cv_activity") if 'MONGO' in config else \
                      config.get('DATABASE', 'cv_collection', fallback="cv_activity") if 'DATABASE' in config else "cv_activity"

logger.info(f"Konfigurasi MongoDB: URI={MONGO_URI}, DB={MONGO_DB}, Enabled={MONGO_ENABLED}")

# Inisialisasi koneksi MongoDB jika diaktifkan
mongo_client = None
mongo_db = None
mongo_sensor_collection = None
mongo_cv_collection = None

if MONGO_ENABLED:
    try:
        mongo_client = MongoClient(MONGO_URI)
        # Cek koneksi
        mongo_client.admin.command('ping')
        mongo_db = mongo_client[MONGO_DB]
        mongo_sensor_collection = mongo_db[MONGO_SENSOR_COLLECTION]
        mongo_cv_collection = mongo_db[MONGO_CV_COLLECTION]
        logger.info(f"Berhasil terhubung ke MongoDB: {MONGO_URI}")
    except ConnectionFailure as e:
        logger.error(f"Gagal terhubung ke MongoDB: {str(e)}")
        MONGO_ENABLED = False
    except Exception as e:
        logger.error(f"Error MongoDB: {str(e)}")
        MONGO_ENABLED = False

# Fungsi-fungsi YOLO
def load_model(animal_type):
    """Load YOLO model for the specified animal type"""
    if animal_type not in yolo_models:
        model_path = AVAILABLE_MODELS.get(animal_type)
        if not os.path.exists(model_path):
            logger.error(f"Model for {animal_type} not found at {model_path}")
            raise ValueError(f"Model for {animal_type} not found at {model_path}")
        
        # Load model using PyTorch Hub
        logger.info(f"Loading YOLO model for {animal_type} from {model_path}")
        yolo_models[animal_type] = torch.hub.load('ultralytics/yolov5', 'custom', 
                                                 path=model_path, force_reload=True)
        logger.info(f"Model for {animal_type} loaded successfully")
    
    return yolo_models[animal_type]

def base64_to_image(base64_string):
    """Convert base64 string to OpenCV image"""
    try:
        # Decode base64 string
        img_data = base64.b64decode(base64_string)
        
        # Convert to numpy array
        nparr = np.frombuffer(img_data, np.uint8)
        
        # Decode image
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        return image
    except Exception as e:
        logger.error(f"Error in base64_to_image: {str(e)}")
        return None

@app.route('/detect', methods=['POST'])
def detect():
    """Endpoint for object detection using YOLO"""
    try:
        data = request.json
        
        if not data or 'image' not in data or 'model' not in data:
            logger.error("Missing required fields in detect request")
            return jsonify({'error': 'Missing required fields'}), 400
        
        image_base64 = data['image']
        model_type = data['model']
        
        # Log request info
        logger.info(f"Received detection request for model: {model_type}, image size: {len(image_base64)} chars")
        
        if model_type not in AVAILABLE_MODELS:
            logger.error(f"Model {model_type} not available")
            return jsonify({'error': f'Model {model_type} not available'}), 400
        
        try:
            # Convert base64 to image
            image = base64_to_image(image_base64)
            if image is None or image.size == 0:
                logger.error("Failed to decode image from base64")
                return jsonify({'error': 'Invalid image data'}), 400
                
            logger.info(f"Successfully decoded image, shape: {image.shape}")
            
            # Untuk debugging
            if not os.path.exists('debug'):
                os.makedirs('debug')
            debug_path = os.path.join('debug', f"last_request_{model_type}.jpg")
            cv2.imwrite(debug_path, image)
            logger.info(f"Saved debug image to {debug_path}")
            
            # Get YOLO model
            model = load_model(model_type)
            
            # Run inference
            results = model(image)
            
            # Extract detection results
            detections = []
            for pred in results.xyxy[0].cpu().numpy():
                x1, y1, x2, y2, conf, cls_id = pred
                
                # Get normalized bounding box coordinates
                img_height, img_width = image.shape[:2]
                x = x1 / img_width
                y = y1 / img_height
                w = (x2 - x1) / img_width
                h = (y2 - y1) / img_height
                
                # Get class name
                class_name = results.names[int(cls_id)]
                
                detections.append({
                    'bbox': [float(x), float(y), float(w), float(h)],
                    'confidence': float(conf),
                    'class': class_name
                })
            
            logger.info(f"Detected {len(detections)} objects with model {model_type}")
            return jsonify({
                'success': True,
                'timestamp': time.time(),
                'detections': detections
            })
        
        except Exception as e:
            logger.error(f"Error during detection: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({'error': str(e)}), 500
    except Exception as e:
        logger.error(f"Unexpected error in detect endpoint: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": "Server error"}), 500

@app.route("/sensor-data", methods=["POST"])
def sensor_data():
    try:
        data = request.json
        if not data or not isinstance(data, dict):
            logger.error("Invalid sensor data received")
            return jsonify({"error": "Invalid data format"}), 400
        
        logger.info(f"Data received: {data}")
        # Tambahkan timestamp jika belum ada
        if "timestamp" not in data:
            data["timestamp"] = datetime.now().isoformat()
        
        # Simpan ke file JSON
        json_saved = save_to_json(data, SENSOR_FILE)
        
        # Simpan ke MongoDB jika diaktifkan
        mongo_saved = False
        if MONGO_ENABLED and mongo_sensor_collection is not None:
            try:
                # Pastikan timestamp dalam format yang benar untuk MongoDB
                if isinstance(data["timestamp"], str):
                    try:
                        data["timestamp"] = datetime.fromisoformat(data["timestamp"])
                    except ValueError:
                        # Jika format datetime tidak valid, biarkan sebagai string
                        pass
                
                result = mongo_sensor_collection.insert_one(data)
                logger.info(f"Data sensor berhasil disimpan ke MongoDB dengan ID: {result.inserted_id}")
                mongo_saved = True
            except Exception as e:
                logger.error(f"Gagal menyimpan data sensor ke MongoDB: {str(e)}")
        
        return jsonify({
            "status": "sensor data saved", 
            "json_saved": json_saved,
            "mongo_saved": mongo_saved
        }), 200
            
    except Exception as e:
        logger.error(f"Unexpected error in sensor_data endpoint: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": "Server error"}), 500

@app.route("/cv-activity", methods=["POST"])
def cv_activity():
    try:
        data = request.json
        if not data or not isinstance(data, dict):
            logger.error("Invalid CV activity data received")
            return jsonify({"error": "Invalid data format"}), 400
            
        # Tambahkan timestamp jika belum ada
        if "timestamp" not in data:
            data["timestamp"] = datetime.now().isoformat()
        
        # Simpan ke file JSON
        json_saved = save_to_json(data, CV_FILE)
        
        # Simpan ke MongoDB jika diaktifkan
        mongo_saved = False
        if MONGO_ENABLED and mongo_cv_collection is not None:
            try:
                # Pastikan timestamp dalam format yang benar untuk MongoDB
                if isinstance(data["timestamp"], str):
                    try:
                        data["timestamp"] = datetime.fromisoformat(data["timestamp"])
                    except ValueError:
                        # Jika format datetime tidak valid, biarkan sebagai string
                        pass
                
                result = mongo_cv_collection.insert_one(data)
                logger.info(f"Data aktivitas berhasil disimpan ke MongoDB dengan ID: {result.inserted_id}")
                mongo_saved = True
            except Exception as e:
                logger.error(f"Gagal menyimpan data aktivitas ke MongoDB: {str(e)}")
        
        return jsonify({
            "status": "cv activity saved", 
            "json_saved": json_saved,
            "mongo_saved": mongo_saved
        }), 200
            
    except Exception as e:
        logger.error(f"Unexpected error in cv_activity endpoint: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": "Server error"}), 500

def save_to_json(data, file_path):
    """Helper function untuk menyimpan data ke file JSON"""
    try:
        with open(file_path, "r") as f:
            try:
                all_data = json.load(f)
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON in {file_path}, resetting to empty list")
                all_data = []
        
        # Tambahkan data baru
        all_data.append(data)
        
        # Ambil max_entries dari konfigurasi
        max_entries = 100
        if 'DATA' in config and 'max_entries' in config['DATA']:
            try:
                max_entries = int(config['DATA']['max_entries'])
            except (ValueError, TypeError):
                logger.warning(f"Invalid max_entries in config, using default: 100")
        
        # Tulis kembali file
        with open(file_path, "w") as f:
            json.dump(all_data[-max_entries:], f, indent=2)  # simpan [max_entries] data terakhir
        
        logger.info(f"Data saved successfully to {file_path}")
        return True
    except Exception as e:
        logger.error(f"Error saving data to JSON: {str(e)}")
        logger.error(traceback.format_exc())
        return False

@app.route("/")
def index():
    return "🐄 FACTS API is running (with YOLO detection)!", 200

@app.route("/status")
def status():
    """Endpoint untuk memeriksa status server dan koneksi MongoDB"""
    mongo_status = "disabled"
    if MONGO_ENABLED:
        try:
            # Cek koneksi MongoDB
            mongo_client.admin.command('ping')
            mongo_status = "connected"
        except Exception as e:
            mongo_status = f"error: {str(e)}"
    
    # Cek model YOLO yang tersedia
    yolo_status = {}
    for model_name, model_path in AVAILABLE_MODELS.items():
        yolo_status[model_name] = {
            "path": model_path,
            "available": os.path.exists(model_path),
            "loaded": model_name in yolo_models
        }
    
    return jsonify({
        "status": "running",
        "timestamp": datetime.now().isoformat(),
        "storage": {
            "json": {
                "enabled": True,
                "path": DATA_DIR
            },
            "mongodb": {
                "enabled": MONGO_ENABLED,
                "status": mongo_status,
                "database": MONGO_DB if MONGO_ENABLED else None
            }
        },
        "yolo_models": yolo_status
    })

@app.route("/download-yolo", methods=["GET"])
def download_yolo():
    """Endpoint untuk mengunduh dan menguji model YOLOv5 dasar"""
    try:
        logger.info("Mengunduh YOLOv5 dari PyTorch Hub...")
        model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
        logger.info("YOLOv5 berhasil diunduh!")
        
        # Test model on a sample image
        sample_img = "https://ultralytics.com/images/zidane.jpg"
        results = model(sample_img)
        detections = len(results.xyxy[0])
        
        return jsonify({
            "success": True,
            "message": "YOLOv5 berhasil diunduh dan diuji",
            "detections": detections,
            "models_directory": MODEL_DIR,
            "available_models": {
                name: os.path.exists(path) for name, path in AVAILABLE_MODELS.items()
            }
        })
        
    except Exception as e:
        logger.error(f"Error downloading YOLOv5: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == "__main__":
    logger.info(f"Starting server with data directory: {DATA_DIR}")
    logger.info(f"MongoDB integration: {'Enabled' if MONGO_ENABLED else 'Disabled'}")
    logger.info(f"YOLO models directory: {MODEL_DIR}")
    
    # Check if models exist
    for model_name, model_path in AVAILABLE_MODELS.items():
        if os.path.exists(model_path):
            logger.info(f"Found model: {model_name} at {model_path}")
        else:
            logger.warning(f"Model for {model_name} not found at {model_path}")
    
    # Ambil konfigurasi server dari file config.ini jika ada
    host = 'localhost'  # Default ke localhost untuk kompatibilitas Windows
    port = 5000
    debug = True
    
    if 'SERVER' in config:
        host = config['SERVER'].get('host', 'localhost')
        port = int(config['SERVER'].get('port', 5000))
        debug = config['SERVER'].getboolean('debug', True)
    
    # Catatan: Di Windows, 0.0.0.0 dapat menyebabkan error
    # Gunakan 'localhost' atau '127.0.0.1' untuk kompatibilitas lebih baik
    if platform.system().lower() == 'windows' and host == '0.0.0.0':
        logger.warning("Detected Windows OS, changing host from 0.0.0.0 to localhost")
        host = 'localhost'
    
    logger.info(f"Starting server on {host}:{port} (debug: {debug})")
    app.run(debug=debug, host=host, port=port)
