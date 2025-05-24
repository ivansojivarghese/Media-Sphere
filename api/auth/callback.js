
import axios from 'axios';
import qs from 'qs';

export default async function handler(req, res) {
  const code = req.query.code;

  if (!code) return res.status(400).send('Missing code');

  try {
    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      qs.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: 'https://media-sphere.vercel.app/api/auth/callback',
        grant_type: 'authorization_code',
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const { access_token } = tokenRes.data;

    const userInfoRes = await axios.get(
      'https://openidconnect.googleapis.com/v1/userinfo',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    res.status(200).json({ user: userInfoRes.data });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('OAuth flow failed');
  }
}
