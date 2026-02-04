-- Create app_settings table for global application configuration
CREATE TABLE public.app_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read app settings (needed for access control checks)
CREATE POLICY "Anyone can read app settings"
ON public.app_settings
FOR SELECT
TO public
USING (true);

-- Only admins can modify app settings
CREATE POLICY "Admins can modify app settings"
ON public.app_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default access control settings
INSERT INTO public.app_settings (setting_key, setting_value) VALUES
('access_control', jsonb_build_object(
    'start_page', 'dashboard',
    'registration_enabled', true,
    'guest_access_enabled', true
));