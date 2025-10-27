# React + Python ITU project setup

## Project Structure

```
project-root/
├── .gitignore
├── README.md
├── azure-frontend-pipeline.yml
├── azure-pipelines.yml
├── package.json
├── requirements.txt
└── src/
    ├── Backend/
    │   └── app.py
    └── Frontend/
        ├── public/
        │   └── index.html
        ├── src/
        │   ├── App.jsx
        │   └── index.js
        └── package.json
```

## Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm

### Backend Setup

1. Create a virtual environment (from project root):
```bash
python -m venv venv
```

2. Activate the virtual environment:
- Windows: `venv\Scripts\activate`
- Mac/Linux: `source venv/bin/activate`

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

### Frontend Setup

Navigate to frontend directory and install dependencies:
```bash
cd src/Frontend
npm install
```

## Running Both Servers

Open two terminal windows from the project root:

**Terminal 1 (Backend):**
```bash
source venv/bin/activate  # or venv\Scripts\activate on Windows
cd src/Backend
python app.py
```
Backend will run on `http://localhost:5000`

**Terminal 2 (Frontend):**
```bash
cd src/Frontend
npm start
```

Visit `http://localhost:3000` to see the app.