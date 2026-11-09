
 🧬**OncoLens** is a research prototype web application designed to demonstrate machine-learning-driven gene-expression classification across five cancer types (BRCA, COAD, KIRC, LUAD, PRAD).

> **Disclaimer:** Research prototype only. Outputs are experimental, not clinically validated, and must not be used for diagnosis or treatment decisions.

## Tech Stack
- **Frontend:** React, Vite, Lucide Icons, Recharts, CSS3
- **Backend:** Python, FastAPI, Uvicorn, Pandas, Scikit-learn
- **Machine Learning:** Saved Random Forest Classifier (20,531 gene features)

## Project Structure
```text
OncoLens/
├── backend/
│   ├── main.py
│   ├── models/
│   │   ├── oncolens_random_forest.joblib
│   │   ├── feature_columns.joblib
│   │   ├── metrics.json
│   │   └── gene_importance.csv
│   └── assets/
└── frontend/
    ├── src/
    │   ├── main.jsx
    │   └── styles.css
    └── package.json
