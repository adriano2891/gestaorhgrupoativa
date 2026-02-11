
-- Make chamados-anexos bucket public so getPublicUrl works for file downloads
UPDATE storage.buckets SET public = true WHERE id = 'chamados-anexos';
