# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import requests

ESM_API_URL = "https://api.esmatlas.com/foldSequence/v1/pdb/"  # ESMFold HTTP API

class PredictRequest(BaseModel):
    sequence: str

class PredictResponse(BaseModel):
    pdb: str

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,   # or ["*"] during dev if you want
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest):
    seq = req.sequence.strip().upper()
    if not seq:
        raise HTTPException(status_code=400, detail="Empty sequence")

    try:
        # ESMFold expects raw sequence in the body (NOT JSON)
        resp = requests.post(
            ESM_API_URL,
            data=seq,
            timeout=120,  # seconds; adjust if needed
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error contacting ESM API: {e}")

    if resp.status_code != 200:
        # ESM API is rate-limited and may sometimes return errors if abused
        raise HTTPException(status_code=resp.status_code, detail=resp.text)

    pdb_text = resp.text
    return PredictResponse(pdb=pdb_text)
