// Send guests to login, or continue if they are already signed in.
export function requireLogin(navigate, isLoggedIn, next) {
  if (!isLoggedIn) {
    navigate(`/login?redirect=${encodeURIComponent(next)}`);
    return false;
  }
  return true;
}
