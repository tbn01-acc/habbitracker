CREATE OR REPLACE FUNCTION public.apply_idea_flow_custom(p_idea_id uuid, p_actions jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  idea_rec record;
  action jsonb;
  created jsonb := '[]'::jsonb;
  new_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_actions IS NULL OR jsonb_typeof(p_actions) <> 'array' THEN
    RAISE EXCEPTION 'invalid_actions';
  END IF;

  SELECT * INTO idea_rec FROM public.ideas
   WHERE id = p_idea_id AND user_id = v_uid
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'idea_not_found'; END IF;

  FOR action IN SELECT * FROM jsonb_array_elements(p_actions) LOOP
    CASE action->>'type'
      WHEN 'task' THEN
        INSERT INTO public.tasks (user_id, name, description, due_date, priority, status, completed)
        VALUES (v_uid, COALESCE(action->>'title','Идея'),
                action->>'description',
                NULLIF(action->>'due_date','')::date,
                COALESCE(action->>'priority','medium'),
                'active', false)
        RETURNING id INTO new_id;
        created := created || jsonb_build_object('type','task','id',new_id);
      WHEN 'habit' THEN
        INSERT INTO public.habits (user_id, name, target_days)
        VALUES (v_uid, COALESCE(action->>'title','Привычка'), ARRAY[1,2,3,4,5,6,7])
        RETURNING id INTO new_id;
        created := created || jsonb_build_object('type','habit','id',new_id);
      WHEN 'goal' THEN
        INSERT INTO public.goals (user_id, name, title, description, target_date, sphere_id, status)
        VALUES (v_uid,
                COALESCE(action->>'title','Цель'),
                COALESCE(action->>'title','Цель'),
                action->>'description',
                NULLIF(action->>'due_date','')::date,
                COALESCE(NULLIF(action->>'sphere_id','')::int, 0),
                'active')
        RETURNING id INTO new_id;
        created := created || jsonb_build_object('type','goal','id',new_id);
      WHEN 'finance' THEN
        INSERT INTO public.transactions (user_id, name, amount, type, date, completed)
        VALUES (v_uid, COALESCE(action->>'title','Операция'),
                COALESCE(NULLIF(action->>'amount','')::numeric, 0),
                COALESCE(action->>'tx_type','expense'),
                COALESCE(NULLIF(action->>'date','')::date, CURRENT_DATE),
                false)
        RETURNING id INTO new_id;
        created := created || jsonb_build_object('type','finance','id',new_id);
      WHEN 'contact' THEN
        INSERT INTO public.contacts (user_id, name, email, phone, description)
        VALUES (v_uid, COALESCE(action->>'title', action->>'name','Контакт'),
                action->>'email', action->>'phone', action->>'description')
        RETURNING id INTO new_id;
        created := created || jsonb_build_object('type','contact','id',new_id);
      ELSE
        NULL;
    END CASE;
  END LOOP;

  UPDATE public.ideas
     SET status = 'approved',
         approved_at = COALESCE(approved_at, now()),
         applied_at = now(),
         updated_at = now()
   WHERE id = p_idea_id;

  RETURN jsonb_build_object('success', true, 'created', created);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.apply_idea_flow_custom(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_idea_flow_custom(uuid, jsonb) TO authenticated, service_role;