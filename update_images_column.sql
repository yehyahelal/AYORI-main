ALTER TABLE public.products ADD COLUMN images TEXT[] DEFAULT '{}';
UPDATE public.products SET images = ARRAY[image_url] WHERE image_url IS NOT NULL;
ALTER TABLE public.products DROP COLUMN image_url;
