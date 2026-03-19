🚀 Setup Instructions

Backend Setup:

cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

Frontend Setup:

cd frontend
yarn install
yarn start

Environment Variables to Update:

Backend .env: Update REACT_APP_BACKEND_URL if deploying elsewhere
Frontend .env: Update REACT_APP_BACKEND_URL to your backend URL
