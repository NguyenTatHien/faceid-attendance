# IT-Global — Face Recognition Service (Python)

Small Flask service used by the **FaceID Attendance System** API for liveness detection and face matching.

## Stack

Python 3.11 · Flask · flask-cors · face_recognition (dlib) · OpenCV · PyTorch · Silent-Face-Anti-Spoofing · Docker

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/check-real-face` | Liveness / anti-spoofing check (real face vs photo or screen) |
| POST | `/extract-embedding` | Return the face embedding for one image |
| POST | `/compare-faces` | Compare two faces |
| POST | `/compare-image` | Compare an image against a stored face |
| POST | `/find-matching-user` | Find the employee whose stored embeddings match |
| POST | `/process-face` | Detect and pre-process a face |

## Run

First clone the liveness models (not included):

```bash
git clone https://github.com/minivision-ai/Silent-Face-Anti-Spoofing silent_face_anti_spoofing
```


```bash
# Requires CMake (for dlib / face_recognition)
python -m venv venv
source venv/Scripts/activate     # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python main.py                   # serves on port 9000 (HTTPS; needs cert files in SSL/)
```

Or with Docker: `docker build -t face-service . && docker run -p 9000:9000 face-service`

Author: **Nguyễn Tất Hiển**
