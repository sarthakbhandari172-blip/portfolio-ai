update public.profile
set avatar_url = '/media/profile/cosmic-avatar.png'
where avatar_url is null
   or avatar_url = '/media/profile/avatar.png';

