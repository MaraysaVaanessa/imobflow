export function isAdmin(): boolean {
  const userString = localStorage.getItem("user");
  if (!userString) return false;
  try {
    const user = JSON.parse(userString);
    return user.role === "admin";
  } catch {
    return false;
  }
}
