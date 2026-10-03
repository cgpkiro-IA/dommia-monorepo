UPDATE public.tenants
SET subdomain = regexp_replace(subdomain, '\.dommia\.com([^[:alnum:].-]|$)', '.dommia.com.mx\1', 'g'),
    custom_domain = regexp_replace(custom_domain, '\.dommia\.com([^[:alnum:].-]|$)', '.dommia.com.mx\1', 'g'),
    access_url = regexp_replace(access_url, '\.dommia\.com([^[:alnum:].-]|$)', '.dommia.com.mx\1', 'g'),
    updated_at = NOW()
WHERE subdomain ~ '\.dommia\.com([^[:alnum:].-]|$)'
   OR custom_domain ~ '\.dommia\.com([^[:alnum:].-]|$)'
   OR access_url ~ '\.dommia\.com([^[:alnum:].-]|$)';

UPDATE public.saas_plans
SET standard_domain_pattern = regexp_replace(
      standard_domain_pattern,
      '\.dommia\.com([^[:alnum:].-]|$)',
      '.dommia.com.mx\1',
      'g'
    ),
    available_addons = regexp_replace(
      available_addons::text,
      '\.dommia\.com([^[:alnum:].-]|$)',
      '.dommia.com.mx\1',
      'g'
    )::jsonb,
    updated_at = NOW()
WHERE standard_domain_pattern ~ '\.dommia\.com([^[:alnum:].-]|$)'
   OR available_addons::text ~ '\.dommia\.com([^[:alnum:].-]|$)';