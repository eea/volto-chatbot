import superagent from 'superagent';

let cached_auth_cookie = null;
// TODO: use time-based invalidation
let last_fetched = null;

const MSG_INVALID_CONFIGURATION =
  'Invalid configuration: missing DANSWER username and password';
const MSG_FETCH_COOKIE = 'Error while fetching authentication cookie';
const MSG_ERROR_REQUEST = 'Error in processing request to Danswer';

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
    console.error(MSG_FETCH_COOKIE, error);
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
      error: MSG_INVALID_CONFIGURATION,
    });
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
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(MSG_ERROR_REQUEST, error);
  }

  res.send({ error: 'nothing yet', path });
}
