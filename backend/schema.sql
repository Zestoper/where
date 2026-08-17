CREATE TABLE location(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(20) NOT NULL CHECK (category IN ('toilet','smoking','trash','water','aed')),
    lname VARCHAR(50) NOT NULL,
    addr VARCHAR(50) NOT NULL,
    POSTGIS geography(Point, 4326) NOT NULL,
    apifrom VARCHAR(30) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    cr_clock TIMESTAMPTZ(6) NOT NULL,
    up_clock TIMESTAMPTZ(6) NOT NULL
);

CREATE INDEX idx_location_coords ON location USING GIST (POSTGIS);
CREATE INDEX idx_location_category ON location (category);


CREATE TABLE report(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES location(id) ON DELETE SET NULL,
    report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('missing','new','incorrect_info')),
    new_category VARCHAR(20),
    new_coords geography(Point, 4326),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','resolved')),
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);


CREATE TABLE favorite(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES location(id) ON DELETE CASCADE,
    device_id VARCHAR(50) NOT NULL,
    create_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    UNIQUE (location_id, device_id)
);
