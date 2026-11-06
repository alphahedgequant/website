BEGIN;
CREATE TEMP TABLE ahq_research_archive(
 arxiv_id text PRIMARY KEY,
 title text NOT NULL,
 summary text NOT NULL,
 authors jsonb NOT NULL,
 categories jsonb NOT NULL,
 published_at timestamptz,
 updated_at timestamptz,
 abstract_url text NOT NULL,
 pdf_url text NOT NULL,
 last_seen timestamptz DEFAULT now()
);
INSERT INTO ahq_research_archive
(arxiv_id,title,summary,authors,categories,published_at,updated_at,abstract_url,pdf_url)
SELECT x.id,x.title,x.summary,x.authors,x.categories,
 NULLIF(x.published,'')::timestamptz,NULLIF(x.updated,'')::timestamptz,
 x.abs,x.pdf
FROM jsonb_to_recordset(
 '[{"id":"2611.01234","title":"First","summary":"Synthetic academic example","authors":["A"],"categories":["q-fin.ST"],"published":"2026-11-03T14:00:00Z","updated":"2026-11-03T14:00:00Z","abs":"https://arxiv.org/abs/2611.01234","pdf":"https://arxiv.org/pdf/2611.01234"}]'::jsonb)
AS x(id text,title text,summary text,authors jsonb,categories jsonb,
     published text,updated text,abs text,pdf text)
WHERE true
ON CONFLICT (arxiv_id) DO UPDATE SET
 title=EXCLUDED.title,summary=EXCLUDED.summary,
 authors=EXCLUDED.authors,categories=EXCLUDED.categories,
 updated_at=EXCLUDED.updated_at,last_seen=now();
INSERT INTO ahq_research_archive
(arxiv_id,title,summary,authors,categories,published_at,updated_at,abstract_url,pdf_url)
SELECT x.id,x.title,x.summary,x.authors,x.categories,
 NULLIF(x.published,'')::timestamptz,NULLIF(x.updated,'')::timestamptz,
 x.abs,x.pdf
FROM jsonb_to_recordset(
 '[{"id":"2611.01234","title":"Revised","summary":"Synthetic academic example","authors":["A","B"],"categories":["q-fin.ST"],"published":"2026-11-03T14:00:00Z","updated":"2026-11-04T14:00:00Z","abs":"https://arxiv.org/abs/2611.01234","pdf":"https://arxiv.org/pdf/2611.01234"}]'::jsonb)
AS x(id text,title text,summary text,authors jsonb,categories jsonb,
     published text,updated text,abs text,pdf text)
WHERE true
ON CONFLICT (arxiv_id) DO UPDATE SET
 title=EXCLUDED.title,summary=EXCLUDED.summary,
 authors=EXCLUDED.authors,categories=EXCLUDED.categories,
 updated_at=EXCLUDED.updated_at,last_seen=now();
DO $$
BEGIN
 IF (SELECT COUNT(*) FROM ahq_research_archive) <> 1 THEN
  RAISE EXCEPTION 'Upsert produced duplicate records';
 END IF;
 IF (SELECT title FROM ahq_research_archive WHERE arxiv_id='2611.01234') <> 'Revised' THEN
  RAISE EXCEPTION 'Upsert failed to refresh title';
 END IF;
 IF (SELECT jsonb_array_length(authors) FROM ahq_research_archive WHERE arxiv_id='2611.01234') <> 2 THEN
  RAISE EXCEPTION 'JSON authors corrupted';
 END IF;
END $$;
ROLLBACK;
