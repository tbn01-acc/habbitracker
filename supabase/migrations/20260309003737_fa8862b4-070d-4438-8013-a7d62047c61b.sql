
-- Create device fingerprints table for digital passport
CREATE TABLE public.device_fingerprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fingerprint_hash text NOT NULL,
  ip_address text,
  user_agent text,
  screen_resolution text,
  timezone text,
  language text,
  platform text,
  canvas_hash text,
  webgl_hash text,
  audio_hash text,
  fonts_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;

-- Only admins can read fingerprints
CREATE POLICY "Admins can read fingerprints" ON public.device_fingerprints
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert their own fingerprint
CREATE POLICY "Users can insert own fingerprint" ON public.device_fingerprints
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own fingerprint
CREATE POLICY "Users can update own fingerprint" ON public.device_fingerprints
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Create index for fast lookup
CREATE INDEX idx_device_fingerprints_user_id ON public.device_fingerprints(user_id);
CREATE INDEX idx_device_fingerprints_hash ON public.device_fingerprints(fingerprint_hash);

-- Also create a banned_fingerprints table to track banned device fingerprints
CREATE TABLE public.banned_fingerprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint_hash text NOT NULL,
  banned_by uuid REFERENCES auth.users(id),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.banned_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage banned fingerprints" ON public.banned_fingerprints
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_banned_fingerprints_hash ON public.banned_fingerprints(fingerprint_hash);
