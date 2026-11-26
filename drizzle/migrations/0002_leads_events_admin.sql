CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TABLE public.user_roles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 role public.app_role NOT NULL,
 UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.leads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 nome text NOT NULL CHECK (char_length(nome) BETWEEN 2 AND 100),
 email text NOT NULL CHECK (char_length(email) <= 255 AND email = lower(email)),
 whatsapp text NOT NULL CHECK (whatsapp ~ '^55[1-9][0-9]{9,10}$'),
 unidade text NOT NULL CHECK (unidade IN ('centro','estreito','sao-jose')),
 modalidade text NOT NULL CHECK (modalidade IN ('musculacao','funcional','pilates','danca')),
 prazo text NOT NULL CHECK (prazo IN ('esta-semana','este-mes','pesquisando')),
 prioridade text NOT NULL CHECK (prioridade IN ('quente','morno','frio')),
 status text NOT NULL DEFAULT 'novo' CHECK (status IN ('novo','encaminhado','em-atendimento','concluido')),
 consentimento boolean NOT NULL CHECK (consentimento = true),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX leads_email_idx ON public.leads(email, created_at DESC);
CREATE INDEX leads_whatsapp_idx ON public.leads(whatsapp, created_at DESC);
GRANT SELECT ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read leads" ON public.leads FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.integration_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
 destino text NOT NULL CHECK (destino IN ('recepcao','webhook')),
 status text NOT NULL CHECK (status IN ('processado','enviado','falhou')),
 detalhe text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX integration_events_lead_idx ON public.integration_events(lead_id);
GRANT SELECT ON public.integration_events TO authenticated;
GRANT ALL ON public.integration_events TO service_role;
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read events" ON public.integration_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE FUNCTION public.register_lead(p_nome text, p_email text, p_whatsapp text, p_unidade text, p_modalidade text, p_prazo text, p_consentimento boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE e text := lower(trim(p_email)); w text := regexp_replace(p_whatsapp, '\D', '', 'g'); pr text; r public.leads;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('lead-email:' || e, 0));
 PERFORM pg_advisory_xact_lock(hashtextextended('lead-whatsapp:' || w, 0));
 IF EXISTS (SELECT 1 FROM public.leads WHERE (email = e OR whatsapp = w) AND created_at > now() - interval '30 days') THEN
  RETURN jsonb_build_object('status','duplicate');
 END IF;
 pr := CASE p_prazo WHEN 'esta-semana' THEN 'quente' WHEN 'este-mes' THEN 'morno' WHEN 'pesquisando' THEN 'frio' END;
 INSERT INTO public.leads(nome,email,whatsapp,unidade,modalidade,prazo,prioridade,status,consentimento)
 VALUES (trim(p_nome), e, w, p_unidade, p_modalidade, p_prazo, pr, 'encaminhado', p_consentimento) RETURNING * INTO r;
 INSERT INTO public.integration_events(lead_id,destino,status,detalhe) VALUES (r.id,'recepcao','processado','Disponível no painel da recepção');
 RETURN jsonb_build_object('status','created','id',r.id,'prioridade',r.prioridade,'created_at',r.created_at);
END $$;
REVOKE ALL ON FUNCTION public.register_lead(text,text,text,text,text,text,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_lead(text,text,text,text,text,text,boolean) TO service_role;
COMMENT ON TABLE public.n8n_submissions IS 'DEPRECATED: replaced by leads + integration_events';