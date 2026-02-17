BEGIN;

-- =============================
-- EXTENSIONS
-- =============================
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================
-- ENUM TYPES
-- =============================
CREATE TYPE alert_type AS ENUM (
    'COMPLAINT_SPIKE',
    'LOW_RESOLUTION_RATE',
    'HIGH_AVG_RESOLUTION_TIME'
);

CREATE TYPE complaint_status AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'RESOLVED',
    'REJECTED',
    'CLOSED'
);

CREATE TYPE department_type AS ENUM (
    'INFRASTRUCTURE',
    'SANITATION',
    'WATER_SUPPLY',
    'ELECTRICITY',
    'HEALTH',
    'TRANSPORT',
    'REVENUE',
    'GENERAL_ADMIN'
);

CREATE TYPE urgency_level AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);

CREATE TYPE user_role AS ENUM (
    'CITIZEN',
    'OFFICER',
    'ADMIN'
);

-- =============================
-- CORE TABLES (NO FKs FIRST)
-- =============================

CREATE TABLE districts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    created_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

CREATE TABLE wards (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    district_id uuid NOT NULL,
    name text NOT NULL,
    population integer DEFAULT 0,
    boundary geometry(MultiPolygon,4326),
    created_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

CREATE TABLE departments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    department_type department_type NOT NULL,
    scope text NOT NULL DEFAULT 'WARD',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz,
    CHECK (scope IN ('DISTRICT','WARD'))
);

CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email citext UNIQUE NOT NULL,
    password_hash text NOT NULL,
    role user_role NOT NULL,
    is_active boolean DEFAULT true,
    aadhaar_encrypted text,
    aadhaar_hash text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

CREATE UNIQUE INDEX unique_aadhaar_hash
ON users (aadhaar_hash)
WHERE aadhaar_hash IS NOT NULL;

-- =============================
-- PROFILE TABLES
-- =============================

CREATE TABLE citizen_profile (
    user_id uuid PRIMARY KEY,
    full_name text NOT NULL,
    created_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

CREATE TABLE officer_profile (
    user_id uuid PRIMARY KEY,
    ward_id uuid NOT NULL,
    designation text NOT NULL,
    created_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

-- =============================
-- CATEGORY TABLE
-- =============================

CREATE TABLE complaint_categories (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    department_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

CREATE INDEX idx_category_department
ON complaint_categories (department_id);

-- =============================
-- COMPLAINTS
-- =============================

CREATE TABLE complaints (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    citizen_id uuid NOT NULL,
    ward_id uuid NOT NULL,
    category_id uuid NOT NULL,
    title text NOT NULL,
    description_raw text NOT NULL,
    address text,
    geo_point geometry(Point,4326),
    urgency_level urgency_level DEFAULT 'MEDIUM',
    corruption_flag boolean DEFAULT false,
    anonymous_flag boolean DEFAULT false,
    current_status complaint_status DEFAULT 'PENDING',
    last_status_changed_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

CREATE INDEX idx_complaints_geo_gist
ON complaints USING gist (geo_point);

CREATE INDEX idx_complaints_status_date
ON complaints (current_status, created_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX idx_complaints_ward_status
ON complaints (ward_id, current_status);

-- =============================
-- ASSIGNMENTS & ESCALATIONS
-- =============================

CREATE TABLE complaint_assignments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id uuid NOT NULL,
    officer_id uuid NOT NULL,
    assigned_at timestamptz NOT NULL DEFAULT now(),
    unassigned_at timestamptz,
    active boolean DEFAULT true
);

CREATE UNIQUE INDEX unique_active_assignment
ON complaint_assignments (complaint_id)
WHERE active = true;

CREATE TABLE complaint_escalations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id uuid NOT NULL,
    escalated_from uuid NOT NULL,
    escalated_to uuid NOT NULL,
    reason text NOT NULL,
    created_at timestamptz DEFAULT now(),
    CHECK (escalated_from <> escalated_to)
);

-- =============================
-- ANALYTICS
-- =============================

CREATE TABLE ward_daily_metrics (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    ward_id uuid NOT NULL,
    metric_date date NOT NULL,
    total_complaints integer DEFAULT 0,
    resolved_count integer DEFAULT 0,
    avg_resolution_time_hours numeric,
    created_at timestamptz DEFAULT now(),
    UNIQUE (ward_id, metric_date)
);

CREATE TABLE alerts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    ward_id uuid NOT NULL,
    alert_type alert_type NOT NULL,
    reference_date date NOT NULL,
    metric_value numeric NOT NULL,
    threshold_value numeric NOT NULL,
    resolved boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    deleted_at timestamptz,
    UNIQUE (ward_id, alert_type, reference_date)
);

-- =============================
-- FOREIGN KEYS (ADDED LAST)
-- =============================

ALTER TABLE wards
ADD FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE;

ALTER TABLE citizen_profile
ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE officer_profile
ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE officer_profile
ADD FOREIGN KEY (ward_id) REFERENCES wards(id) ON DELETE CASCADE;

ALTER TABLE complaint_categories
ADD FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE;

ALTER TABLE complaints
ADD FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE complaints
ADD FOREIGN KEY (ward_id) REFERENCES wards(id) ON DELETE CASCADE;

ALTER TABLE complaints
ADD FOREIGN KEY (category_id) REFERENCES complaint_categories(id) ON DELETE CASCADE;

ALTER TABLE complaint_assignments
ADD FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE;

ALTER TABLE complaint_assignments
ADD FOREIGN KEY (officer_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE complaint_escalations
ADD FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE;

ALTER TABLE complaint_escalations
ADD FOREIGN KEY (escalated_from) REFERENCES users(id);

ALTER TABLE complaint_escalations
ADD FOREIGN KEY (escalated_to) REFERENCES users(id);

ALTER TABLE ward_daily_metrics
ADD FOREIGN KEY (ward_id) REFERENCES wards(id) ON DELETE CASCADE;

ALTER TABLE alerts
ADD FOREIGN KEY (ward_id) REFERENCES wards(id) ON DELETE CASCADE;

COMMIT;
