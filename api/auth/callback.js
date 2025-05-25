export default async function handler(req, res) {
  const code = req.query.code;

  if (!code) {
    return res.status(400).json({ error: 'Missing code' });
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: 'https://media-sphere.vercel.app/api/auth/callback',
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    // localStorage.setItem('access_token', accessToken);

    if (tokenData.error) {
      return res.status(400).json({ error: tokenData.error_description || tokenData.error });
    }

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const user = await userRes.json();

    // Get YouTube channel data (requires YouTube scope!)
    const ytRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const youtube = await ytRes.json();

    // Optionally: store user info or session here
    // For now, just return the user info
    // return res.status(200).json({ user });

    return res.status(200).json({ user, youtube });

  } catch (error) {
    console.error('OAuth callback error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
