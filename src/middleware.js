import superagent from 'superagent';
import fetch from 'node-fetch';

let cached_auth_cookie = null;
// TODO: use time-based invalidation
// eslint-disable-next-line
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
  const path = req.url.replace('/_da/', '/');

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

  const options = {
    method: req.method,
    headers: {
      Cookie: cached_auth_cookie,
      'Content-Type': 'application/json',
    },
  };

  if (req.body && req.method === 'POST') {
    options.body = JSON.stringify(req.body);
  }
  try {
    const response = await fetch(url, options, req.body);

    if (response.headers.get('transfer-encoding') === 'chunked') {
      res.set('Content-Type', 'text/event-stream');
    } else {
      res.set('Content-Type', 'application/json');
    }

    response.body.pipe(res);
  } catch (error) {
    // eslint-disable-next-line
    console.error(MSG_ERROR_REQUEST, error?.response?.text);
    res.send({ error: error?.response?.text || 'error' });
  }
}
