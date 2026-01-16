-- Force PostgREST to reload schema cache to pick up the corrected function
NOTIFY pgrst, 'reload schema';