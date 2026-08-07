import { UserProfile } from "../../types";


interface ProfileAboutProps {
  profile: UserProfile | null;
  userRecipesCount?: number;
  favoritesCount?: number;
};

function ProfileAbout({
  profile,
  // userRecipesCount,
  // favoritesCount,

}: ProfileAboutProps) {


  return (
    <>
      <div className="w-full glass-card rounded-xl p-8 border ">
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

        {/* <div>
          <h3 className="text-sm text-secondary uppercase tracking-wider mb-2">Stats</h3>
          <div className="space-y-2 text-secondary">
            <p>{userRecipesCount || 0} recipe{userRecipesCount !== 1 ? 's' : ''} shared</p>
            <p>{favoritesCount} favorite {favoritesCount === 1 ? 'recipe' : 'recipes'}
            </p>
            <p>{profile?.followersCount || 0} followers · {profile?.followingCount || 0} following
            </p>
          </div>
        </div> */}
      </div>
    </>
  );
}

export default ProfileAbout;