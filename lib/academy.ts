
import { createClient } from "./supabase";

export interface Academy {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
  created_at: string;
}

export interface AcademyMember {
  id: string;
  academy_id: string;
  user_id: string;
  role: "admin" | "tutor";
  name: string;
  email: string;
  joined_at: string;
}

// Get current user's academy (as admin or tutor)
export async function getUserAcademy() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Check if admin (owns an academy)
  const { data: ownedAcademy } = await supabase
    .from("academies")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (ownedAcademy) return { academy: ownedAcademy, role: "admin" as const };

  // Check if member
  const { data: membership } = await supabase
    .from("academy_members")
    .select("*, academies(*)")
    .eq("user_id", user.id)
    .single();

  if (membership) return { academy: membership.academies as Academy, role: membership.role as "admin" | "tutor" };

  return null;
}
