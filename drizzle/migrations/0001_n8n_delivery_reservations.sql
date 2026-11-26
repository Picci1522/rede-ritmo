CREATE TABLE public.n8n_submissions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 email text NOT NULL UNIQUE,
 whatsapp text NOT NULL UNIQUE,
 payload jsonb NOT NULL,
 retry_token uuid NOT NULL,
 status text NOT NULL DEFAULT 'processing' CHECK(status IN ('processing','failed','delivered')),
 created_at timestamptz NOT NULL DEFAULT now(),
 attempt_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.n8n_submissions TO service_role;
ALTER TABLE public.n8n_submissions ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.claim_n8n_submission(p_payload jsonb, p_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE r public.n8n_submissions; e text := p_payload->>'email'; w text := p_payload->>'whatsapp';
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('email:' || e, 0));
 PERFORM pg_advisory_xact_lock(hashtextextended('whatsapp:' || w, 0));
 SELECT * INTO r FROM public.n8n_submissions WHERE email=e OR whatsapp=w LIMIT 1 FOR UPDATE;
 IF FOUND THEN
  IF r.retry_token=p_token AND r.email=e AND r.whatsapp=w AND (r.status='failed' OR (r.status='processing' AND r.attempt_at < now()-interval '60 seconds')) THEN
   UPDATE public.n8n_submissions SET status='processing', attempt_at=now(), payload=p_payload WHERE id=r.id;
   RETURN jsonb_build_object('status','claimed','id',r.id,'created_at',r.created_at);
  END IF;
  RETURN jsonb_build_object('status','duplicate');
 END IF;
 IF EXISTS(SELECT 1 FROM public.trial_requests WHERE lower(trim(email))=e OR whatsapp=w) THEN
  RETURN jsonb_build_object('status','duplicate');
 END IF;
 INSERT INTO public.n8n_submissions(email,whatsapp,payload,retry_token) VALUES(e,w,p_payload,p_token) RETURNING * INTO r;
 RETURN jsonb_build_object('status','claimed','id',r.id,'created_at',r.created_at);
END $$;
REVOKE ALL ON FUNCTION public.claim_n8n_submission(jsonb,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_n8n_submission(jsonb,uuid) TO service_role;
COMMENT ON TABLE public.trial_requests IS 'Legacy campaign records preserved; new submissions use n8n_submissions. Priority for new requests is exclusively assigned by n8n.';