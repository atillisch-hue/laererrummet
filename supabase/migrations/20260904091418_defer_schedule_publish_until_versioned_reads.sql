revoke execute on function public.publish_schedule_version(bigint,date) from authenticated;
comment on function public.publish_schedule_version(bigint,date) is 'Reserved for the versioned schedule rollout. EXECUTE remains revoked until schedule editors and calendar readers select an explicit schedule version.';
