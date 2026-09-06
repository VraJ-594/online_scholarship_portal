// Centralizes the localStorage.getItem("userInfo") + JSON.parse pattern that
// was previously duplicated (unguarded) across 15+ components. A corrupted
// or partial value (e.g. a tab crash mid-write) would otherwise throw a
// SyntaxError and crash whichever component read it.
export const getStoredUserInfo = () => {
  try {
    return JSON.parse(localStorage.getItem("userInfo"));
  } catch (e) {
    return null;
  }
};
