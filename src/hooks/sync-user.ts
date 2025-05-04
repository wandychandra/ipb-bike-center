// src/hooks/sync-user.ts
import { supabase } from "@/lib/supabase"
// Pakai tipe UserResource langsung dari Clerk NextJS
import type { UserResource } from "@clerk/types"

// sekarang signature-nya cocok persis dengan useUser()
export async function syncUser(user: UserResource): Promise<void> {
  if (!user) return

  // 1) Cek apakah user sudah ada
  const { data: existingUser, error: selectError } = await supabase
    .from("Users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle()
  if (selectError) {
    console.error("Error checking existing user:", selectError)
    throw selectError
  }

  // 2) Jika belum, insert
  if (!existingUser) {
    const { error: insertError } = await supabase
      .from("Users")
      .insert({
        id: user.id,
        email: user.emailAddresses?.[0]?.emailAddress ?? "",
        name: user.fullName || user.username || "",
        role: user.publicMetadata?.role || "user",
      })
    if (insertError) {
      console.error("Error inserting new user:", insertError)
      throw insertError
    }
  }
}
