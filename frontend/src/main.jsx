import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, ArrowDownToLine, ArrowUpRight, BarChart3, BrainCircuit, CheckCircle2, ChevronRight, CircleHelp, Dna, FileSpreadsheet, FlaskConical, Gauge, LayoutDashboard, Menu, Microscope, PanelLeftClose, RefreshCw, ShieldAlert, Sparkles, UploadCloud, X } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import './styles.css';

const API = import.meta.env.VITE_API_URL || '';
const nav = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'analysis', label: 'New analysis', icon: UploadCloud },
  { id: 'results', label: 'Results', icon: BarChart3 },
  { id: 'insights', label: 'Model insights', icon: BrainCircuit },
  { id: 'about', label: 'About OncoLens', icon: CircleHelp }
];
const COLORS = ['#60e1d2', '#7ba7ff', '#b69bff', '#f5bd6c', '#f28ca6'];

function App() {
  const [page, setPage] = useState('overview');
  const [meta, setMeta] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    fetch(`${API}/api/metadata`)
      .then((r) => {
        if (!r.ok) throw new Error('API unavailable');
        return r.json();
      })
      .then((d) => {
        setMeta(d);
        setApiStatus('online');
      })
      .catch(() => setApiStatus('offline'));
  }, []);

  const distribution = useMemo(
    () => (result ? Object.entries(result.class_distribution).map(([name, value]) => ({ name, value })) : []),
    [result]
  );

  const go = (id) => {
    setPage(id);
    setMobileOpen(false);
  };

  async function runAnalysis(e) {
    e?.preventDefault();
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch(`${API}/api/predict`, { method: 'POST', body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || 'Analysis failed');
      setResult(payload);
      setPage('results');
    } catch (err) {
      setError(err.message || 'Could not connect to the OncoLens API.');
    } finally {
      setBusy(false);
    }
  }

  function downloadResults() {
    if (!result) return;
    const cols = ['Sample', 'Predicted Cancer Type', 'Maximum Model Score (%)'];
    const rows = result.results.map((r) => [r.sample, r.predicted_cancer_type, r.maximum_model_score ?? '']);
    const csv = [cols, ...rows]
      .map((row) => row.map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'oncolens_predictions.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const title = nav.find((n) => n.id === page)?.label || 'Overview';

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`sidebar ${mobileOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="brand">
          <div className="brand-mark">
            <Dna size={23} />
          </div>
          {!sidebarCollapsed && (
            <div>
              <div className="brand-name">
                Onco<span>Lens</span>
              </div>
              <div className="brand-sub">BIOINFORMATICS INTELLIGENCE</div>
            </div>
          )}
          <button className="icon-btn mobile-close" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {!sidebarCollapsed && <div className="workspace-label">WORKSPACE</div>}

        <nav>
          {nav.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => go(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon size={18} />
              {!sidebarCollapsed && <span>{item.label}</span>}
              {!sidebarCollapsed && page === item.id && <ChevronRight size={15} className="nav-arrow" />}
            </button>
          ))}
        </nav>

        {!sidebarCollapsed && (
          <div className="sidebar-bottom">
            <div className="status-card">
              <div className="status-head">
                <span className={`status-dot ${apiStatus === 'online' ? '' : 'muted'}`}></span>
                <span>{apiStatus === 'online' ? 'API connected' : apiStatus === 'checking' ? 'Connecting…' : 'API offline'}</span>
              </div>
              <p>{apiStatus === 'online' ? 'Prediction service is ready.' : 'Start the Python backend to enable analysis.'}</p>
            </div>
            <div className="sidebar-foot">
              <span>ONCOLENS</span>
              <span>RESEARCH BUILD 1.0</span>
            </div>
          </div>
        )}
      </aside>

      {mobileOpen && <button className="scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-btn menu-btn" onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </button>
            <button
              className="icon-btn desktop-toggle-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <PanelLeftClose size={20} className={sidebarCollapsed ? 'rotate-180' : ''} />
            </button>
            <div className="breadcrumbs">
              Workspace <span>/</span> <b>{title}</b>
            </div>
          </div>

          <div className="top-actions">
            <span className="env-pill">
              <span className="status-dot"></span> Research environment
            </span>
            <div className="avatar">OL</div>
          </div>
        </header>

        <div className="content">
          <div className="page-kicker">
            <span className="kicker-line"></span> BIOINFORMATICS <span className="kicker-dot">·</span> MACHINE LEARNING
          </div>
          <div className="page-heading-row">
            <div>
              <h1>
                {page === 'overview'
                  ? 'Explore the unseen.'
                  : page === 'analysis'
                  ? 'Run an analysis.'
                  : page === 'results'
                  ? 'Analysis results.'
                  : page === 'insights'
                  ? 'Inside the model.'
                  : 'About OncoLens.'}
              </h1>
              <p className="page-lead">
                {page === 'overview'
                  ? 'Explore gene-expression data with an experimental machine-learning classifier.'
                  : page === 'analysis'
                  ? 'Upload a compatible gene-expression CSV and let the classifier analyse each sample.'
                  : page === 'results'
                  ? 'Review sample-level predictions and the distribution across predicted cancer categories.'
                  : page === 'insights'
                  ? 'Explore the supplied evaluation metrics and the genes that influenced the trained model.'
                  : 'A research prototype exploring machine learning for gene-expression classification.'}
              </p>
            </div>
            <div className="heading-orb">
              <Dna size={35} />
            </div>
          </div>

          <div className="notice">
            <ShieldAlert size={19} />
            <span>
              <b>Research prototype only.</b> Outputs are experimental, not clinically validated, and must not be used for diagnosis or treatment decisions.
            </span>
          </div>

          {page === 'overview' && <Overview meta={meta} go={go} result={result} />}
          {page === 'analysis' && (
            <section className="panel analysis-panel">
              <div className="section-title">
                <div>
                  <span className="eyebrow">DATA INPUT</span>
                  <h2>Upload gene-expression data</h2>
                  <p>Provide a CSV file containing the model's required gene features.</p>
                </div>
                <div className="step-chip">
                  STEP 01 <ChevronRight size={13} /> ANALYSE
                </div>
              </div>
              <form onSubmit={runAnalysis}>
                <label className={`dropzone ${file ? 'has-file' : ''}`} htmlFor="csv-file">
                  <input
                    id="csv-file"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => {
                      setFile(e.target.files?.[0] || null);
                      setError('');
                    }}
                  />
                  <div className="upload-icon">
                    <UploadCloud size={26} />
                  </div>
                  <h3>{file ? file.name : 'Drop your CSV file here'}</h3>
                  <p>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · Ready to upload` : 'or click to browse from your computer'}</p>
                  <span className="file-hint">
                    <FileSpreadsheet size={14} /> CSV format · Maximum 200 MB
                  </span>
                </label>
                {error && <div className="error-box">{error}</div>}
                <div className="upload-details">
                  <div>
                    <b>Required features</b>
                    <span>{meta?.gene_features?.toLocaleString() || '20,531'} gene-expression columns</span>
                  </div>
                  <div>
                    <b>Supported classes</b>
                    <span>BRCA · COAD · KIRC · LUAD · PRAD</span>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn secondary" onClick={() => { setFile(null); setError(''); }} disabled={!file}>
                    Clear file
                  </button>
                  <button className="btn primary" type="submit" disabled={!file || busy || apiStatus !== 'online'}>
                    {busy ? (
                      <>
                        <RefreshCw className="spin" size={16} /> Analysing…
                      </>
                    ) : (
                      <>
                        Run classification <ArrowUpRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          )}
          {page === 'results' && <Results result={result} distribution={distribution} download={downloadResults} go={go} />}
          {page === 'insights' && <Insights meta={meta} />}
          {page === 'about' && <About />}

          <footer className="footer">
            <span>ONCOLENS <i>·</i> GENE EXPRESSION CLASSIFICATION</span>
            <span>Built for research & learning</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

function Overview({ meta, go, result }) {
  return (
    <>
      <div className="stats-grid">
        <Stat label="CLASSIFIER" value={meta?.classifier || 'Random Forest'} icon={BrainCircuit} accent />
        <Stat label="GENE FEATURES" value={meta?.gene_features?.toLocaleString() || '—'} icon={Dna} />
        <Stat label="TRAINING SAMPLES" value={meta?.train_samples?.toLocaleString() || '—'} icon={FlaskConical} />
        <Stat label="ANALYSED HERE" value={result?.samples_analysed?.toLocaleString() || '0'} icon={Activity} />
      </div>
      <div className="overview-grid">
        <section className="panel workflow">
          <div className="panel-head">
            <div>
              <span className="eyebrow">GET STARTED</span>
              <h2>Your analysis workspace</h2>
            </div>
            <span className="muted-tag">3 STEPS</span>
          </div>
          <div className="workflow-list">
            <div className="workflow-item">
              <div className="workflow-num">01</div>
              <div>
                <h3>Upload your dataset</h3>
                <p>Bring a CSV containing the model's required gene-expression features.</p>
              </div>
              <FileSpreadsheet />
            </div>
            <div className="workflow-item">
              <div className="workflow-num">02</div>
              <div>
                <h3>Validate your data</h3>
                <p>Check feature names, missing values and numeric inputs before inference.</p>
              </div>
              <CheckCircle2 />
            </div>
            <div className="workflow-item">
              <div className="workflow-num">03</div>
              <div>
                <h3>Explore predictions</h3>
                <p>Review predicted categories, sample scores and distribution charts.</p>
              </div>
              <BarChart3 />
            </div>
          </div>
          <button className="btn primary" onClick={() => go('analysis')}>
            Start new analysis <ArrowUpRight size={16} />
          </button>
        </section>
        <section className="panel snapshot">
          <div className="panel-head">
            <div>
              <span className="eyebrow">MODEL SNAPSHOT</span>
              <h2>Performance overview</h2>
            </div>
            <Gauge size={19} />
          </div>
          <div className="metric-big">
            <span>Held-out test accuracy</span>
            <strong>{meta?.accuracy != null ? `${(meta.accuracy * 100).toFixed(2)}%` : '—'}</strong>
            <small>As recorded in the supplied metrics file</small>
          </div>
          <div className="metric-row">
            <div>
              <span>Macro F1-score</span>
              <b>{meta?.macro_f1 != null ? meta.macro_f1.toFixed(4) : '—'}</b>
            </div>
            <div>
              <span>Test samples</span>
              <b>{meta?.test_samples ?? '—'}</b>
            </div>
          </div>
          <div className="class-tags">
            {(meta?.classes || ['BRCA', 'COAD', 'KIRC', 'LUAD', 'PRAD']).map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
          <p className="tiny-note">Metrics are supplied project results, not independent clinical validation.</p>
        </section>
      </div>
    </>
  );
}

function Stat({ label, value, icon: Icon, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <Icon size={17} />
      </div>
      <strong className={accent ? 'accent' : ''}>{value}</strong>
    </div>
  );
}

function Results({ result, distribution, download, go }) {
  if (!result)
    return (
      <div className="empty-state panel">
        <div className="empty-icon">
          <BarChart3 />
        </div>
        <h2>No analysis results yet</h2>
        <p>Upload a gene-expression CSV to generate sample-level predictions.</p>
        <button className="btn primary" onClick={() => go('analysis')}>
          Start an analysis <ArrowUpRight size={16} />
        </button>
      </div>
    );
  return (
    <>
      <div className="result-summary">
        <Stat label="SAMPLES ANALYSED" value={result.samples_analysed.toLocaleString()} icon={Activity} accent />
        <Stat label="PREDICTED CATEGORIES" value={distribution.length} icon={Dna} />
        <div className="result-file">
          <FileSpreadsheet />
          <div>
            <b>{result.filename}</b>
            <span>Successfully processed</span>
          </div>
        </div>
      </div>
      <div className="results-grid">
        <section className="panel chart-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">CLASS DISTRIBUTION</span>
              <h2>Predicted categories</h2>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={distribution} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#203349" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#91a5b9', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#71869c', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#101f31', border: '1px solid #29415b', borderRadius: 12, color: '#e8f0f7' }} />
                <Bar dataKey="value" name="Samples" radius={[6, 6, 0, 0]}>
                  {distribution.map((d, i) => (
                    <Cell key={d.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel chart-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">CATEGORY SHARE</span>
              <h2>Sample composition</h2>
            </div>
          </div>
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={4}>
                  {distribution.map((d, i) => (
                    <Cell key={d.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#101f31', border: '1px solid #29415b', borderRadius: 12, color: '#e8f0f7' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <b>{result.samples_analysed}</b>
              <span>samples</span>
            </div>
          </div>
          <div className="legend">
            {distribution.map((d, i) => (
              <span key={d.name}>
                <i style={{ background: COLORS[i % COLORS.length] }} />
                {d.name}
                <b>{d.value}</b>
              </span>
            ))}
          </div>
        </section>
      </div>
      <section className="panel table-panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">INFERENCE OUTPUT</span>
            <h2>Sample predictions</h2>
          </div>
          <button className="btn secondary" onClick={download}>
            <ArrowDownToLine size={15} /> Export CSV
          </button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Sample</th>
                <th>Predicted cancer type</th>
                <th>Maximum model score</th>
              </tr>
            </thead>
            <tbody>
              {result.results.map((r, i) => (
                <tr key={i}>
                  <td className="sample-name">{r.sample}</td>
                  <td>
                    <span className="class-badge">{r.predicted_cancer_type}</span>
                  </td>
                  <td>{r.maximum_model_score != null ? `${r.maximum_model_score.toFixed(2)}%` : 'Not available'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-foot">Showing all {result.results.length.toLocaleString()} predictions. Model scores are not clinical probabilities.</div>
      </section>
    </>
  );
}

function Insights({ meta }) {
  return (
    <>
      <div className="stats-grid">
        <Stat label="TEST ACCURACY" value={meta?.accuracy != null ? `${(meta.accuracy * 100).toFixed(2)}%` : '—'} icon={Gauge} accent />
        <Stat label="MACRO F1-SCORE" value={meta?.macro_f1?.toFixed(4) || '—'} icon={Activity} />
        <Stat label="TREES IN FOREST" value={meta?.n_estimators ?? '—'} icon={BrainCircuit} />
        <Stat label="TEST SET" value={meta?.test_samples ?? '—'} icon={FlaskConical} />
      </div>
      <div className="insight-grid">
        <section className="panel image-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">EVALUATION</span>
              <h2>Confusion matrix</h2>
            </div>
          </div>
          <img src={`${API}/assets/confusion_matrix.png`} alt="Supplied model confusion matrix" />
        </section>
        <section className="panel image-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">FEATURE ANALYSIS</span>
              <h2>Top gene importance</h2>
            </div>
          </div>
          <img src={`${API}/assets/top20_gene_importance.png`} alt="Supplied top twenty gene importance chart" />
        </section>
      </div>
      <div className="notice subtle-notice">
        <ShieldAlert size={18} />
        <span>
          These metrics and visualisations are taken from the supplied project artifacts. Before making performance claims, verify the train/test split, check for data leakage, and evaluate on an independent external dataset.
        </span>
      </div>
    </>
  );
}

function About() {
  return (
    <div className="about-grid">
      <section className="panel about-main">
        <div className="about-symbol">
          <Microscope size={30} />
        </div>
        <span className="eyebrow">THE PROJECT</span>
        <h2>Making gene-expression analysis more accessible.</h2>
        <p>
          OncoLens is an experimental bioinformatics application that demonstrates how a machine-learning model can analyse gene-expression features and classify samples into five cancer categories.
        </p>
        <p>
          The platform combines an interactive React dashboard with a Python inference API and a saved Random Forest classifier.
        </p>
        <div className="class-tags">
          {['BRCA', 'COAD', 'KIRC', 'LUAD', 'PRAD'].map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
      </section>
      <section className="panel tech-panel">
        <span className="eyebrow">TECHNOLOGY STACK</span>
        <h2>Built with</h2>
        {[
          ['React', 'Interactive web interface'],
          ['FastAPI', 'Python prediction API'],
          ['Scikit-learn', 'Random Forest classifier'],
          ['Pandas & NumPy', 'Gene-expression processing'],
          ['Docker', 'Containerised deployment'],
          ['Vultr', 'Cloud hosting target'],
        ].map(([a, b]) => (
          <div className="tech-row" key={a}>
            <b>{a}</b>
            <span>{b}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);