create extension if not exists "pgcrypto";

create table if not exists promo_banners (
  id uuid default gen_random_uuid() primary key,
  badge_text text,
  title text not null,
  subtitle text,
  cta_text text,
  cta_link text,
  background_image_url text,
  background_color text,
  position integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index if not exists promo_banners_active_position_idx
  on promo_banners (is_active, position);

insert into promo_banners (
  badge_text,
  title,
  subtitle,
  cta_text,
  cta_link,
  background_image_url,
  background_color,
  position,
  is_active
)
select *
from (
  values
    (
      'Curated edit',
      'Men''s Collection',
      'Street-ready fits for every vibe',
      'Shop Men''s',
      '/shop?gender=men',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=80',
      '#111827',
      0,
      true
    ),
    (
      'Curated edit',
      'Women''s Collection',
      'Elegant & bold styles for every occasion',
      'Shop Women''s',
      '/shop?gender=women',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1400&q=80',
      '#431407',
      1,
      true
    )
) as seed (
  badge_text,
  title,
  subtitle,
  cta_text,
  cta_link,
  background_image_url,
  background_color,
  position,
  is_active
)
where not exists (select 1 from promo_banners limit 1);
