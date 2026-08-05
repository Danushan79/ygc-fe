import { ProfileForm } from "@/components/account/profile-form";
import { requireCurrentUser } from "@/lib/auth/session";

export default async function ProfilePage() {
  const user = await requireCurrentUser();

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-900">Update Profile</h2>
      <p className="mt-1 text-sm text-slate-500">Manage your personal details and password.</p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <ProfileForm user={user} />
      </div>
    </div>
  );
}
