from pathlib import Path
from io import BytesIO
import json

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parent
MODEL_DIR = ROOT / "models"
ASSET_DIR = ROOT / "assets"

app = FastAPI(title="OncoLens API", version="1.0.0", description="Research prototype for gene-expression classification")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
app.mount("/assets", StaticFiles(directory=ASSET_DIR), name="assets")

try:
    model = joblib.load(MODEL_DIR / "oncolens_random_forest.joblib")
    feature_columns = list(joblib.load(MODEL_DIR / "feature_columns.joblib"))
    with open(MODEL_DIR / "metrics.json", encoding="utf-8") as f:
        metrics = json.load(f)
    gene_importance = pd.read_csv(MODEL_DIR / "gene_importance.csv")
except Exception as exc:
    raise RuntimeError(f"Could not load OncoLens model files: {exc}") from exc

if not feature_columns:
    raise RuntimeError("The saved feature list is empty.")

@app.get("/api/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}

@app.get("/api/metadata")
def metadata():
    top_genes = gene_importance.head(20).to_dict(orient="records")
    return {
        "classifier": "Random Forest",
        "gene_features": len(feature_columns),
        "dataset_samples": metrics.get("dataset_samples"),
        "train_samples": metrics.get("train_samples"),
        "test_samples": metrics.get("test_samples"),
        "accuracy": metrics.get("accuracy"),
        "macro_f1": metrics.get("macro_f1"),
        "classes": metrics.get("classes", []),
        "n_estimators": metrics.get("n_estimators"),
        "top_genes": top_genes,
    }

@app.post("/api/predict")
async def predict(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a CSV file.")
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="The uploaded CSV is empty.")
    
    # Updated limit to 200 MB
    if len(raw) > 200 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File is larger than the 200 MB upload limit.")
        
    try:
        data = pd.read_csv(BytesIO(raw))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read CSV: {exc}") from exc
    if data.empty:
        raise HTTPException(status_code=400, detail="The CSV contains no data rows.")
    if data.columns.duplicated().any():
        duplicates = data.columns[data.columns.duplicated()].tolist()
        raise HTTPException(status_code=400, detail=f"Duplicate column names found: {', '.join(map(str, duplicates[:8]))}")
    missing = [name for name in feature_columns if name not in data.columns]
    if missing:
        raise HTTPException(status_code=400, detail=f"{len(missing):,} required gene features are missing. Examples: {', '.join(map(str, missing[:10]))}")
    X = data.loc[:, feature_columns].apply(pd.to_numeric, errors="coerce")
    if X.isna().any().any():
        bad = X.columns[X.isna().any()].tolist()
        raise HTTPException(status_code=400, detail="Missing or non-numeric values found in: " + ", ".join(map(str, bad[:10])))
    if not np.isfinite(X.to_numpy()).all():
        raise HTTPException(status_code=400, detail="Infinite values were found in the gene-expression data.")
    try:
        predictions = model.predict(X)
        probabilities = model.predict_proba(X) if hasattr(model, "predict_proba") else None
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc
    rows = []
    for index, prediction in enumerate(predictions):
        row = {"sample": f"Sample {index + 1}", "predicted_cancer_type": str(prediction)}
        if probabilities is not None:
            row["maximum_model_score"] = round(float(np.max(probabilities[index]) * 100), 2)
        rows.append(row)
    counts = pd.Series([str(x) for x in predictions]).value_counts().to_dict()
    return {"filename": file.filename, "samples_analysed": len(rows), "class_distribution": counts, "results": rows}