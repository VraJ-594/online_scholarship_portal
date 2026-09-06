const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Verifies a Google ID token and returns its payload, or throws if the
// token is invalid, expired, or wasn't issued for our GOOGLE_CLIENT_ID.
// Callers must still check payload.hd/email themselves -- this only
// proves the token is a real, unmodified token from Google.
const verifyGoogleIdToken = async (idToken) => {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
};

module.exports = { verifyGoogleIdToken };
