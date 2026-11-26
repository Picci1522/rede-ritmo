CREATE TABLE public.trial_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 nome text NOT NULL CHECK (char_length(nome) BETWEEN 2 AND 100),
 email text NOT NULL CHECK (char_length(email) <= 255),
 whatsapp text NOT NULL UNIQUE CHECK (whatsapp ~ '^55[1-9][0-9]{9,10}$'),
 unidade text NOT NULL CHECK (unidade IN ('centro','estreito','sao-jose')),
 modalidade text NOT NULL CHECK (modalidade IN ('musculacao','funcional','pilates','danca')),
 prazo text NOT NULL CHECK (prazo IN ('esta-semana','este-mes','pesquisando')),
 classificacao text GENERATED ALWAYS AS (CASE prazo WHEN 'esta-semana' THEN 'quente' WHEN 'este-mes' THEN 'morno' ELSE 'frio' END) STORED,
 consentimento boolean NOT NULL CHECK (consentimento = true),
 created_at timestamptz NOT NULL DEFAULT now(),
 integration_status text NOT NULL DEFAULT 'pending' CHECK (integration_status IN ('pending','delivered','failed')),
 delivered_at timestamptz
);
GRANT ALL ON public.trial_requests TO service_role;
ALTER TABLE public.trial_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX trial_requests_reception_idx ON public.trial_requests(unidade, classificacao, created_at DESC);
COMMENT ON TABLE public.trial_requests IS 'One request per normalized WhatsApp for this campaign. Private; writes only through validated server handler. Success only after integration delivery.';