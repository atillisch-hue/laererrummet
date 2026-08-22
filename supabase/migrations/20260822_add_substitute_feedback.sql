-- Tilbagemelding fra vikaren til den faste lærer på den konkrete vikartime.
-- Feltet ligger på samme assignment som vikarplanen, så beskeden følger dato + lektion + lærer + vikar.

alter table public.substitute_assignments
  add column if not exists substitute_feedback text;

comment on column public.substitute_assignments.substitute_feedback is
  'Kort tilbagemelding fra vikaren til den fraværende lærer efter vikartimen.';
