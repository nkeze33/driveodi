// ==========================================
// SAVE AUTH DATA
// ==========================================
export function saveAuth(token, user) {
  localStorage.setItem("token", token);

  /**
   * 🔥 Ensure subscription fields always exist
   * Prevents crashes + wrong redirects
   */
  const safeUser = {
    ...user,
    subscriptionStatus: user?.subscriptionStatus || "inactive",
    isSubscriptionActive: user?.isSubscriptionActive || false,
    trialEndDate: user?.trialEndDate || null,
  };

  localStorage.setItem("user", JSON.stringify(safeUser));
}

// ==========================================
// GET TOKEN
// ==========================================
export function getToken() {
  return localStorage.getItem("token");
}

// ==========================================
// GET USER
// ==========================================
export function getUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

// ==========================================
// UPDATE USER (🔥 VERY IMPORTANT)
// Keeps user data fresh after API calls
// ==========================================
export function updateUser(updatedFields) {
  const currentUser = getUser();

  if (!currentUser) return;

  const updatedUser = {
    ...currentUser,
    ...updatedFields,
  };

  localStorage.setItem("user", JSON.stringify(updatedUser));
}

// ==========================================
// LOGOUT
// ==========================================
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// ==========================================
// CHECK AUTH
// ==========================================
export function isAuthenticated() {
  return !!getToken();
}