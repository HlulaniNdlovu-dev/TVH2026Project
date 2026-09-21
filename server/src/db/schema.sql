-- PowerLink schema. Applied automatically on server start (every statement is CREATE TABLE IF NOT EXISTS).
-- Each table has real columns for the fields the app filters or joins on, plus a JSON `data` column holding the
-- full record (nested things such as an incident timeline live there). `seq` keeps insertion order.

CREATE TABLE IF NOT EXISTS users (
  seq INT AUTO_INCREMENT PRIMARY KEY,
  id VARCHAR(32) NOT NULL UNIQUE,
  role VARCHAR(16) NOT NULL,
  phone VARCHAR(20) NULL,
  email VARCHAR(190) NULL,
  data JSON NOT NULL,
  KEY idx_users_role (role),
  KEY idx_users_phone (phone),
  KEY idx_users_email (email)
);

CREATE TABLE IF NOT EXISTS nodes (
  seq INT AUTO_INCREMENT PRIMARY KEY,
  id VARCHAR(32) NOT NULL UNIQUE,
  type VARCHAR(16) NOT NULL,
  parent_id VARCHAR(32) NULL,
  area VARCHAR(64) NULL,
  meter_number VARCHAR(32) NULL,
  data JSON NOT NULL,
  KEY idx_nodes_meter (meter_number),
  KEY idx_nodes_parent (parent_id)
);

CREATE TABLE IF NOT EXISTS incidents (
  seq INT AUTO_INCREMENT PRIMARY KEY,
  id VARCHAR(32) NOT NULL UNIQUE,
  status VARCHAR(24) NOT NULL,
  node_id VARCHAR(32) NULL,
  technician_id VARCHAR(32) NULL,
  area VARCHAR(64) NULL,
  data JSON NOT NULL,
  KEY idx_incidents_status (status),
  KEY idx_incidents_node (node_id),
  KEY idx_incidents_tech (technician_id)
);

CREATE TABLE IF NOT EXISTS reports (
  seq INT AUTO_INCREMENT PRIMARY KEY,
  id VARCHAR(32) NOT NULL UNIQUE,
  user_id VARCHAR(32) NULL,
  incident_id VARCHAR(32) NULL,
  data JSON NOT NULL,
  KEY idx_reports_user (user_id),
  KEY idx_reports_incident (incident_id)
);

CREATE TABLE IF NOT EXISTS jobs (
  seq INT AUTO_INCREMENT PRIMARY KEY,
  id VARCHAR(32) NOT NULL UNIQUE,
  incident_id VARCHAR(32) NULL,
  technician_id VARCHAR(32) NULL,
  state VARCHAR(24) NOT NULL,
  data JSON NOT NULL,
  KEY idx_jobs_incident (incident_id),
  KEY idx_jobs_tech (technician_id),
  KEY idx_jobs_state (state)
);

CREATE TABLE IF NOT EXISTS notifications (
  seq INT AUTO_INCREMENT PRIMARY KEY,
  id VARCHAR(32) NOT NULL UNIQUE,
  user_id VARCHAR(32) NULL,
  incident_id VARCHAR(32) NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  data JSON NOT NULL,
  KEY idx_notifications_user (user_id),
  KEY idx_notifications_incident (incident_id)
);

CREATE TABLE IF NOT EXISTS sms (
  seq INT AUTO_INCREMENT PRIMARY KEY,
  id VARCHAR(32) NOT NULL UNIQUE,
  data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS audit (
  seq INT AUTO_INCREMENT PRIMARY KEY,
  id VARCHAR(32) NOT NULL UNIQUE,
  data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS loadshedding (
  seq INT AUTO_INCREMENT PRIMARY KEY,
  id VARCHAR(32) NOT NULL UNIQUE,
  data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS suppressed (
  seq INT AUTO_INCREMENT PRIMARY KEY,
  id VARCHAR(32) NOT NULL UNIQUE,
  data JSON NOT NULL
);

-- Commands the backend queues for the simulator (for example "restore power").
CREATE TABLE IF NOT EXISTS commands (
  seq INT AUTO_INCREMENT PRIMARY KEY,
  data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS photos (
  id VARCHAR(32) PRIMARY KEY,
  data LONGTEXT NOT NULL
);

-- Sequential, human friendly ids such as INC-1001.
CREATE TABLE IF NOT EXISTS counters (
  prefix VARCHAR(16) PRIMARY KEY,
  value INT NOT NULL
);
