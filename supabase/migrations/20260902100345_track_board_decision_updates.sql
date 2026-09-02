drop trigger if exists validate_board_decision_responsible on public.board_decisions;
create trigger validate_board_decision_responsible
before insert or update of meeting_id,decision,responsible,responsible_user_id,due_date,completed
on public.board_decisions
for each row execute function private.validate_board_decision_responsible();
