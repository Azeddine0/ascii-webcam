from flask import Flask, request, jsonify, send_from_directory
import numpy as np
import cv2
import base64
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Character sets for different detail levels
CHAR_SETS = {
    'standard': '@%#*+=-:. ',
    'simple': '@#. ',
    'complex': '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ',
    'matrix': '01'
}

@app.route('/')
def index():
    return send_from_directory('../frontend', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('../frontend', path)

@app.route('/api/process-frame', methods=['POST'])
def process_frame():
    try:
        data = request.json

        # Get base64 encoded image
        image_data = data.get('image', '')
        if not image_data or not image_data.startswith('data:image'):
            return jsonify({'error': 'Invalid image data'}), 400

        # Get processing parameters
        resolution = data.get('resolution', 'medium')
        charset_type = data.get('charset', 'standard')
        color_mode = data.get('colorMode', 'green')
        enhance_detail = data.get('enhanceDetail', False)
        watchdogs_mode = data.get('watchdogsMode', False)

        # Decode base64 image
        image_data = image_data.split(',')[1]
        image_bytes = base64.b64decode(image_data)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        # Store original image for color information
        original_img = img.copy()

        # Apply Watch Dogs style filter if enabled
        if watchdogs_mode:
            # Increase blue channel, decrease red
            img = img.astype(np.float32)
            img[:,:,0] *= 0.7  # Reduce red
            img[:,:,2] *= 1.3  # Increase blue
            img = np.clip(img, 0, 255).astype(np.uint8)

            # Add blue tint
            blue_tint = np.zeros_like(img, dtype=np.uint8)
            blue_tint[:,:,2] = 30  # Add blue
            img = cv2.addWeighted(img, 1, blue_tint, 0.3, 0)

        # Convert to grayscale for processing
        img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Apply enhanced detail processing if requested
        if enhance_detail:
            # Apply histogram equalization for better contrast
            img_gray = cv2.equalizeHist(img_gray)

            # Apply edge detection
            edges = cv2.Canny(img_gray, 50, 150)

            # Combine original with edges
            img_gray = cv2.addWeighted(img_gray, 0.7, edges, 0.3, 0)

            # Apply sharpening
            kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
            img_gray = cv2.filter2D(img_gray, -1, kernel)

        # Resolution settings
        resolution_map = {
            'ultra': (150, 75),
            'high': (120, 60),
            'medium': (80, 40),
            'low': (60, 30)
        }
        width, height = resolution_map.get(resolution, (80, 40))

        # Resize images
        img_resized = cv2.resize(img_gray, (width, height))
        img_color = cv2.resize(original_img, (width, height))

        # Get character set
        charset = CHAR_SETS.get(charset_type, CHAR_SETS['standard'])

        # Convert to ASCII
        ascii_result = []
        for y in range(height):
            row = []
            for x in range(width):
                pixel_value = img_resized[y, x]
                char_idx = int(pixel_value / 255 * (len(charset) - 1))
                char = charset[char_idx]

                if color_mode == 'green':
                    intensity = int(pixel_value / 255 * 5)
                    color = f"rgb(0, {100 + intensity * 30}, 0)"
                elif color_mode == 'amber':
                    intensity = int(pixel_value / 255 * 5)
                    color = f"rgb({180 + intensity * 15}, {100 + intensity * 20}, 0)"
                elif color_mode == 'blue':
                    intensity = int(pixel_value / 255 * 5)
                    color = f"rgb(0, {100 + intensity * 20}, {150 + intensity * 20})"
                elif color_mode == 'grayscale':
                    color = f"rgb({pixel_value}, {pixel_value}, {pixel_value})"
                elif color_mode == 'color':
                    b, g, r = img_color[y, x]
                    color = f"rgb({r}, {g}, {b})"
                else:
                    color = None

                row.append({
                    'char': char,
                    'color': color
                })
            ascii_result.append(row)

        # Add Watch Dogs style metadata if enabled
        metadata = None
        if watchdogs_mode:
            # Simulate facial detection
            faces = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml').detectMultiScale(
                img_gray, 1.3, 5
            )

            metadata = {
                'mode': 'watchdogs',
                'faces': len(faces),
                'system': 'CTOS v2.0',
                'status': 'ACTIVE'
            }

        return jsonify({
            'ascii': ascii_result,
            'width': width,
            'height': height,
            'metadata': metadata
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)