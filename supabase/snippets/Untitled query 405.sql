create function public.after_vote_cast()
returns trigger as $$
begin
  if (select status from public.disputes where id = new.dispute_id) != 'voting' then
    raise exception 'voting window is not open';
  end if;

  if new.vote = 'client' then
    update public.disputes set votes_for_client = votes_for_client + 1 where id = new.dispute_id;
  else
    update public.disputes set votes_for_freelancer = votes_for_freelancer + 1 where id = new.dispute_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_after_vote_cast
  after insert on public.dao_votes
  for each row execute procedure public.after_vote_cast();
