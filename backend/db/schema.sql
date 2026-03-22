CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL,
  modalities_json TEXT NOT NULL,
  model_used TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  inference_duration_seconds REAL
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  status TEXT NOT NULL,
  model_id TEXT,
  profile TEXT,
  selected_modalities_json TEXT DEFAULT '[]',
  queue_position INTEGER,
  created_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  error_message TEXT,
  FOREIGN KEY(case_id) REFERENCES cases(id)
);

CREATE TABLE IF NOT EXISTS log_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id TEXT NOT NULL,
  line_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(job_id) REFERENCES jobs(id)
);

CREATE INDEX IF NOT EXISTS idx_jobs_case_id ON jobs(case_id);
CREATE INDEX IF NOT EXISTS idx_log_lines_job_id ON log_lines(job_id);
CREATE INDEX IF NOT EXISTS idx_log_lines_created_at ON log_lines(created_at);
