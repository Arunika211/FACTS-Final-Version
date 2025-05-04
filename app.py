import gradio as gr
import torch
import cv2
import numpy as np
import os
import time
from PIL import Image, ImageDraw, ImageFont
import tempfile
import logging
import sys

# Konfigurasi logging
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                   handlers=[logging.StreamHandler(sys.stdout)])
logger = logging.getLogger(__name__)

# Konfigurasi untuk YOLO
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

# Daftar model yang tersedia
AVAILABLE_MODELS = {
    "sapi": os.path.join(MODEL_DIR, "sapi.pt"),
    "ayam": os.path.join(MODEL_DIR, "ayam.pt"),
    "kambing": os.path.join(MODEL_DIR, "kambing.pt"),
    "yolov5s": "yolov5s"  # Model default
}

# Dictionary untuk menyimpan model yang sudah di-load
yolo_models = {}

def load_model(model_type):
    """Load model YOLO sesuai jenis yang dipilih"""
    if model_type not in yolo_models:
        logger.info(f"Loading model: {model_type}")
        
        # Jika menggunakan model default
        if model_type == "yolov5s":
            try:
                model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
                yolo_models[model_type] = model
                logger.info(f"Model {model_type} loaded successfully")
            except Exception as e:
                logger.error(f"Error loading default model: {str(e)}")
                raise
        # Jika menggunakan model kustom
        else:
            model_path = AVAILABLE_MODELS.get(model_type)
            if os.path.exists(model_path):
                try:
                    model = torch.hub.load('ultralytics/yolov5', 'custom', path=model_path)
                    yolo_models[model_type] = model
                    logger.info(f"Custom model {model_type} loaded successfully")
                except Exception as e:
                    logger.error(f"Error loading custom model {model_type}: {str(e)}")
                    # Fallback ke model default
                    model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
                    yolo_models[model_type] = model
                    logger.info(f"Fallback to default model")
            else:
                logger.warning(f"Model {model_type} not found at {model_path}, using default")
                model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
                yolo_models[model_type] = model
                
    return yolo_models[model_type]

def detect_objects(image, model_type="yolov5s"):
    """Deteksi objek pada gambar menggunakan model yang dipilih"""
    try:
        # Load model
        model = load_model(model_type)
        
        # Convert PIL Image ke numpy array jika perlu
        if isinstance(image, Image.Image):
            image_np = np.array(image)
        else:
            image_np = image
            
        # Jalankan deteksi
        start_time = time.time()
        results = model(image_np)
        inference_time = time.time() - start_time
        logger.info(f"Inference completed in {inference_time:.2f} seconds")
        
        # Visualisasi hasil
        results_image = Image.fromarray(results.render()[0])
        
        # Ambil hasil deteksi
        detections = []
        for pred in results.xyxy[0].cpu().numpy():
            x1, y1, x2, y2, conf, cls_id = pred
            class_name = results.names[int(cls_id)]
            detections.append({
                'class': class_name,
                'confidence': float(conf),
                'bbox': [float(x1), float(y1), float(x2), float(y2)]
            })
            
        return results_image, detections, inference_time
    
    except Exception as e:
        logger.error(f"Error in detection: {str(e)}")
        return None, [], 0

def process_image(input_image, model_selection):
    """Fungsi utama untuk memproses gambar"""
    try:
        if input_image is None:
            return None, "Tidak ada gambar yang diupload", None
        
        # Proses deteksi
        output_image, detections, inference_time = detect_objects(input_image, model_selection)
        
        if not detections:
            result_text = f"Tidak ada objek yang terdeteksi (waktu: {inference_time:.2f}s)"
        else:
            result_text = f"Terdeteksi {len(detections)} objek (waktu: {inference_time:.2f}s):\n"
            for i, det in enumerate(detections, 1):
                result_text += f"{i}. {det['class']} ({det['confidence']:.2f})\n"
        
        return output_image, result_text, detections
    
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return None, f"Error: {str(e)}", None

def check_model_status():
    """Cek status model YOLO"""
    status = {}
    
    for name, path in AVAILABLE_MODELS.items():
        if name == "yolov5s":
            status[name] = {"available": True, "loaded": name in yolo_models}
        else:
            status[name] = {
                "available": os.path.exists(path),
                "path": path,
                "loaded": name in yolo_models
            }
    
    # Cek juga versi torch dan sistem
    system_info = {
        "torch_version": torch.__version__,
        "cuda_available": torch.cuda.is_available()
    }
    
    return {"models": status, "system": system_info}

def get_system_status():
    """Mendapatkan status sistem dan model untuk ditampilkan"""
    status = check_model_status()
    
    status_text = "### Status Model\n\n"
    for name, info in status["models"].items():
        if name == "yolov5s":
            status_text += f"- **{name}**: {'✅ Tersedia' if info['available'] else '❌ Tidak tersedia'} | {'✅ Loaded' if info['loaded'] else '❓ Belum diload'}\n"
        else:
            status_text += f"- **{name}**: {'✅ Tersedia' if info['available'] else '❌ Tidak tersedia'} | {'✅ Loaded' if info['loaded'] else '❓ Belum diload'}\n"
    
    status_text += "\n### Sistem\n\n"
    status_text += f"- **PyTorch Version**: {status['system']['torch_version']}\n"
    status_text += f"- **CUDA Available**: {'✅ Ya' if status['system']['cuda_available'] else '❌ Tidak'}\n"
    
    return status_text

# Buat interface Gradio
with gr.Blocks(title="FACTS API - Animal Detection") as demo:
    gr.Markdown("# 🐄 FACTS API - Animal Detection")
    gr.Markdown("Upload gambar untuk mendeteksi hewan dengan model YOLO")
    
    with gr.Tab("Deteksi Hewan"):
        with gr.Row():
            with gr.Column():
                input_image = gr.Image(type="pil", label="Upload Gambar")
                model_selection = gr.Dropdown(
                    choices=list(AVAILABLE_MODELS.keys()), 
                    value="yolov5s", 
                    label="Pilih Model"
                )
                detect_button = gr.Button("Deteksi Objek", variant="primary")
            
            with gr.Column():
                output_image = gr.Image(type="pil", label="Hasil Deteksi")
                result_text = gr.Textbox(label="Hasil", lines=5)
                json_output = gr.JSON(label="Detail Deteksi")
        
        detect_button.click(
            process_image, 
            inputs=[input_image, model_selection], 
            outputs=[output_image, result_text, json_output]
        )
    
    with gr.Tab("Status Sistem"):
        status_text = gr.Markdown()
        refresh_button = gr.Button("Refresh Status")
        refresh_button.click(get_system_status, inputs=[], outputs=[status_text])
    
    # Inisialisasi status
    demo.load(get_system_status, inputs=[], outputs=[status_text])

# Jalankan aplikasi Gradio
if __name__ == "__main__":
    demo.launch()