INSERT INTO storage.buckets (id, name, public)
VALUES (
  COALESCE(current_setting('app.settings.popup_bucket', true), 'popup-images'),
  COALESCE(current_setting('app.settings.popup_bucket', true), 'popup-images'),
  true
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    name = EXCLUDED.name;
