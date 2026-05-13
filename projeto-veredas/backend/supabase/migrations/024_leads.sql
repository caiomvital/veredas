CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  escola TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_insert_public" ON leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "leads_select_auth" ON leads
  FOR SELECT
  TO authenticated
  USING (true);
