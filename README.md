# The Zyndicator

**The Zyndicator** is a tool for swiftly redeeming Zyn reward codes using your phone's camera. It scans QR codes, extracts the embedded code using OCR, and submits it to a server for storage and later redemption.

## Features

- **Live Camera Scanning:** Uses your device's camera to scan Zyn QR codes.
- **Automatic OCR:** Extracts the alphanumeric code from the scanned QR using Tesseract.js.
- **Duplicate Detection:** Prevents duplicate codes from being saved.
- **Real-Time Feedback:** Shows status messages for code submission.
- **Mobile Friendly:** Designed to work on mobile browsers (HTTPS required for camera access).

## How It Works

1. **Frontend (public/):**
   - `index.html` provides the UI and loads the necessary scripts.
   - `main.js` handles camera access, QR detection (via jsQR), region-of-interest extraction, and OCR (via Tesseract.js).
   - When a code is detected, it is displayed on screen and can be submitted to the server.

2. **Backend (server.js):**
   - Serves the frontend files using Express.
   - Receives codes via Socket.IO from the client.
   - Stores unique codes in `codes.txt` and keeps an in-memory cache to prevent duplicates.
   - Provides real-time status updates to the client.

3. **Dev Container:**
   - The `.devcontainer/` folder provides a Docker-based development environment with all dependencies pre-installed.

## Setup & Usage

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- (Optional) [Docker](https://www.docker.com/) for dev container support

### Install Dependencies

```sh
npm install
```

### Start the Server

```sh
npm start
```

The server will start on [http://localhost:3000](http://localhost:3000).

### Access from Your Phone

For camera access on mobile devices, you need to use HTTPS. You can use [ngrok](https://ngrok.com/) to expose your local server:

```sh
ngrok http 3000
```

Update the `phoneUrl` in `server.js` with your ngrok HTTPS URL. When you start the server, a QR code will be printed in the terminal for easy access from your phone.

### Using the App

1. Open the app in your mobile browser.
2. Allow camera access.
3. Point the camera at a Zyn QR code.
4. The code will be detected and displayed.
5. Tap "Submit Code" to send it to the server.
6. Status messages will confirm if the code was saved or is a duplicate.

## File Structure

- `server.js` — Express/Socket.IO backend for code storage
- `public/` — Frontend HTML, JS, and OCR logic
- `codes.txt` — Stores submitted codes (not tracked by git)
- `.devcontainer/` — Dev container configuration for VS Code

## License

MIT License. See [LICENSE](LICENSE) for