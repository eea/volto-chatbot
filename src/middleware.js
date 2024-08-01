import superagent from 'superagent';

let cached_auth_cookie = null;
let last_fetched = null;

const INVALID_MSG =
  'Invalid configuration: missing DANSWER username and password';
const FETCH_AUTH_COOKIE_MSG = 'Error while fetching authentication cookie';

async function get_login_cookie(username, password) {
  const url = `${process.env.DANSWER_URL}/api/auth/login`;
  const data = {
    username,
    password,
    scope: '',
    client_id: '',
    client_secret: '',
    grant_type: '',
  };
  try {
    const response = await superagent.post(url).type('form').send(data);
    const header = response.headers['set-cookie'][0];
    return header;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in fetching login cookie', error);
  }
}

export default async function middleware(req, res, next) {
  const path = req.url.replace('/_danswer/', '/');

  const handler = superagent[req.method.toLowerCase()];
  const url = `${process.env.DANSWER_URL}/api${path}`;

  const username = process.env.DANSWER_USERNAME;
  const password = process.env.DANSWER_PASSWORD;

  if (!(username && password)) {
    res.send({
      error: INVALID_MSG,
    });
    // eslint-disable-next-line no-console
    console.warn(INVALID_MSG);
    return;
  }

  if (!cached_auth_cookie) {
    cached_auth_cookie = await get_login_cookie(username, password);
  }

  try {
    const response = await handler(url)
      .type('json')
      .set('Cookie', cached_auth_cookie);
    res.send(response.body);
    return;
  } catch {}

  res.send({ error: 'nothing yet', path });
}
