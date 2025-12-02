# main.py
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# ---- Test PDB (same as in your React app) ----
TEST_PDB = """
ATOM      1  N   GLY A   1      11.104  13.207  10.217  1.00 20.00           N  
ATOM      2  CA  GLY A   1      12.560  13.300  10.091  1.00 20.00           C  
ATOM      3  C   GLY A   1      13.057  14.679   9.658  1.00 20.00           C  
ATOM      4  O   GLY A   1      12.353  15.651   9.873  1.00 20.00           O  
ATOM      5  N   ALA A   2      14.262  14.770   9.036  1.00 20.00           N  
ATOM      6  CA  ALA A   2      14.864  16.053   8.628  1.00 20.00           C  
ATOM      7  C   ALA A   2      14.107  16.613   7.408  1.00 20.00           C  
ATOM      8  O   ALA A   2      13.460  15.892   6.648  1.00 20.00           O  
TER
END
""".strip()


class PredictRequest(BaseModel):
  sequence: str


class PredictResponse(BaseModel):
  pdb: str


app = FastAPI()

origins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]

# Allow your React dev server to call this
app.add_middleware(
  CORSMiddleware,
  allow_origins=origins,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)


@app.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest):
  seq = req.sequence.strip().upper()

  # TODO: basic validation
  if not seq:
    return PredictResponse(pdb="")

  # ---- STUB IMPLEMENTATION ----
  # Later, replace this with a real call to ESMFold/ColabFold/AlphaFold.
  # For now, always return TEST_PDB so you can wire up the frontend.
  return PredictResponse(pdb=TEST_PDB)
