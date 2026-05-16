-- Allow doctors to read profiles of patients assigned to them.
-- Without this, ng_profiles RLS blocks joined profile rows from returning,
-- causing full_name to be null everywhere a doctor fetches patient data.
CREATE POLICY "Doctors can view patient profiles" ON ng_profiles
  FOR SELECT USING (
    id IN (SELECT id FROM ng_patients WHERE doctor_id = auth.uid())
  );
