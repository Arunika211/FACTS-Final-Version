import torch
import os
import glob
import json
import platform
from pathlib import Path

# Path model
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
print(f"Model directory: {MODEL_DIR}")

# Check semua file .pt
pt_files = glob.glob(os.path.join(MODEL_DIR, "*.pt"))
print(f"Found model files: {pt_files}")

# Cek versi torch
print(f"PyTorch version: {torch.__version__}")
print(f"Python version: {platform.python_version()}")
print(f"Platform: {platform.system()} {platform.release()}")

# Simpan informasi ini ke file untuk dilihat nanti
system_info = {
    "platform": f"{platform.system()} {platform.release()}",
    "python": platform.python_version(),
    "torch": torch.__version__,
    "model_files": [os.path.basename(p) for p in pt_files],
}

with open("system_info.json", "w") as f:
    json.dump(system_info, f, indent=2)

# Coba load YOLOv5 default
try:
    print("Loading default YOLOv5s model...")
    model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
    print("Default model loaded successfully")
    
    # Test dengan gambar sample
    sample_img = "https://ultralytics.com/images/zidane.jpg"
    results = model(sample_img)
    print(f"Default model detections: {len(results.xyxy[0])}")
except Exception as e:
    print(f"Error loading default model: {str(e)}")

# Coba load model kustom jika ada
for model_path in pt_files:
    model_name = os.path.basename(model_path)
    try:
        print(f"Loading custom model: {model_name}...")
        model = torch.hub.load('ultralytics/yolov5', 'custom', path=model_path)
        print(f"Custom model {model_name} loaded successfully")
        
        # Test dengan gambar sample
        try:
            sample_img = "https://ultralytics.com/images/zidane.jpg"
            results = model(sample_img)
            print(f"Model {model_name} detections: {len(results.xyxy[0])}")
        except Exception as e:
            print(f"Error testing {model_name}: {str(e)}")
    except Exception as e:
        print(f"Error loading {model_name}: {str(e)}")

print("Model testing completed!")
