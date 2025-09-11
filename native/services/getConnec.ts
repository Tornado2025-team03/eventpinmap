import { supabase } from "../lib/supabase";

// Get users and event names where user's available window matches future event window
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

  // Filter out entries where start_at or end_at is null
  const filteredUsers = (users || []).filter((u) => u.start_at && u.end_at);
  const filteredEvents = (events || []).filter((e) => e.start_at && e.end_at);

  // Match users and events with identical time windows
  const matches: { user: any; event: any }[] = [];
  for (const user of filteredUsers) {
    for (const event of filteredEvents) {
      if (user.start_at <= event.start_at && user.end_at >= event.end_at) {
        matches.push({ user, event });
      }
    }
  }

  return matches;
}
