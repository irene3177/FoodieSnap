import { UserProfile } from "../../types";


interface ProfileAboutProps {
  profile: UserProfile | null;
  userRecipesCount?: number;
  favoritesCount?: number;
};

function ProfileAbout({
  profile,

}: ProfileAboutProps) {


  return (
    <>
      <div className="w-full bg-accent-secondary-bg rounded-xl p-8 border ">
        <div className="mb-6">
          <h2 className="font-headline-sm text-headline-sm mb-2 text-accent-secondary">About</h2>
          <p className="text-primary leading-relaxed whitespace-pre-wrap">
            {profile?.bio || `${profile?.username} hasn't added a bio yet.`}
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-sm text-secondary uppercase tracking-wider mb-2">Member Since</h3>
          <p className="text-primary">
            {profile?.createdAt 
              ? new Date(profile?.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              : 'Recently joined'}
          </p>
        </div>
      </div>
    </>
  );
}

export default ProfileAbout;