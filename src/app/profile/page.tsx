import { redirect } from "next/navigation";
import { requireUserPage } from "@/lib/auth";
import { getOwnProfile } from "@/lib/queries";

export default async function ProfilePage() {
  const user = await requireUserPage("/profile");
  const profile = await getOwnProfile(user.id);
  redirect(profile ? `/specialists/${profile.slug}` : "/profile/edit");
}
