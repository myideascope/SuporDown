-- Add service_checks table for storing check results
CREATE TABLE IF NOT EXISTS service_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  response_time INTEGER,
  status_code INTEGER,
  error_message TEXT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_service_checks_service_id ON service_checks(service_id);
CREATE INDEX IF NOT EXISTS idx_service_checks_checked_at ON service_checks(checked_at);
CREATE INDEX IF NOT EXISTS idx_service_checks_status ON service_checks(status);

-- Add columns to services table for current status tracking
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS current_status TEXT DEFAULT 'healthy' CHECK (current_status IN ('healthy', 'degraded', 'down')),
ADD COLUMN IF NOT EXISTS last_checked TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_response_time INTEGER DEFAULT 0;