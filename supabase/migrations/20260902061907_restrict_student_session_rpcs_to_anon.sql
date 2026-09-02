revoke execute on function public.student_start_session(text) from authenticated;
revoke execute on function public.student_end_session(text) from authenticated;
revoke execute on function public.student_session_data(text) from authenticated;
revoke execute on function public.student_session_feedback(text) from authenticated;
revoke execute on function public.student_session_grammar_assignments(text) from authenticated;
revoke execute on function public.save_student_draft_session(text, bigint, jsonb) from authenticated;
revoke execute on function public.save_student_grammar_attempt_session(text, bigint, jsonb, integer, integer) from authenticated;
revoke execute on function public.get_student_training_progress_session(text) from authenticated;
revoke execute on function public.save_student_training_attempt_session(text, text, text, text, text, jsonb, integer, integer) from authenticated;
