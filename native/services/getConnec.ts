import { supabase } from "../lib/supabase";

export async function getMatchingUsersAndEvents(): Promise<
  { user: any; event: any }[]
> {
  const now = new Date().toISOString();

  // Fetch future events
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("*")
    .gte("start_at", now);

  if (eventsError) {
    console.error("Error fetching future events:", eventsError);
    throw eventsError;
  }

  // Fetch future available users
  const { data: users, error: usersError } = await supabase
    .from("user_statuses")
    .select("*")
    .gte("end_at", now);

  if (usersError) {
    console.error("Error fetching future available users:", usersError);
    throw usersError;
  }

  // Fetch user profiles for nickname lookup
  const { data: profiles, error: profilesError } = await supabase
    .from("user_profiles")
    .select("id, nickname, profile_image_url");

  if (profilesError) {
    console.error("Error fetching user profiles:", profilesError);
    throw profilesError;
  }

  // Fetch all event_members for future events
  const eventIds = (events || []).map((e) => e.id);
  let eventMembers: any[] = [];
  if (eventIds.length > 0) {
    const { data: members, error: membersError } = await supabase
      .from("event_members")
      .select("user_id, event_id, role")
      .in("event_id", eventIds);

    if (membersError) {
      console.error("Error fetching event members:", membersError);
      throw membersError;
    }
    eventMembers = members || [];
  }

  // Create a lookup map for user nicknames and profile images
  const profileMap = new Map<
    string,
    { nickname: string; profile_image_url: string | null }
  >();
  (profiles || []).forEach((profile) => {
    profileMap.set(profile.id, {
      nickname: profile.nickname,
      profile_image_url: profile.profile_image_url || null,
    });
  });

  // Filter out entries where start_at or end_at is null
  const filteredUsers = (users || []).filter((u) => u.start_at && u.end_at);
  const filteredEvents = (events || []).filter((e) => e.start_at && e.end_at);

  // Match users and events with time window check and add nickname
  const matches: { user: any; event: any }[] = [];
  for (const user of filteredUsers) {
    for (const event of filteredEvents) {
      // Availability check: user's window must fully contain event window
      if (
        new Date(user.start_at) >= new Date(event.start_at) ||
        new Date(user.end_at) <= new Date(event.end_at)
      ) {
        continue;
      }

      // Check if user is already a member or invited for this event
      const alreadyMember = eventMembers.some(
        (m) =>
          m.event_id === event.id &&
          m.user_id === user.user_id &&
          (m.role === "participant" ||
            m.role === "invited" ||
            m.role === "organizer" ||
            m.role === "cohost"),
      );
      if (alreadyMember) continue;

      const profile = profileMap.get(user.user_id);
      matches.push({
        user: {
          ...user,
          nickname: profile?.nickname || null,
          avatar_url: profile?.profile_image_url || null,
        },
        event,
      });
    }
  }
  return matches;
}
