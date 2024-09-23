import superagent from 'superagent';
import fetch from 'node-fetch';

let cached_auth_cookie = null;
let last_fetched = null;
let maxAge;

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

async function getAuthCookie(username, password) {
  cached_auth_cookie = await get_login_cookie(username, password);
  if (cached_auth_cookie) {
    const maxAgeMatch = cached_auth_cookie.match(/Max-Age=(\d+)/);
    maxAge = parseInt(maxAgeMatch[1]);
    last_fetched = new Date();
  }
}

async function login(username, password) {
  const diff = maxAge - (new Date() - last_fetched) / 1000;
  // eslint-disable-next-line no-console
  console.log('danswer auth still valid for seconds: ', diff);
  if (!cached_auth_cookie || diff < 0) {
    await getAuthCookie(username, password);
  }
}

async function check_credentials() {
  const reqUrl = `${process.env.DANSWER_URL}/api/persona/-1`;

  const options = {
    method: 'GET',
    headers: {
      Cookie: cached_auth_cookie,
      'Content-Type': 'application/json',
    },
  };
  return await fetch(reqUrl, options);
}

async function send_danswer_request(req, res, { username, password, url }) {
  await login(username, password);

  try {
    const resp = await check_credentials();
    if (resp.status !== 200) {
      await getAuthCookie(username, password);
    }
  } catch (error) {
    await getAuthCookie(username, password);
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
    throw error;
  }
}

export default async function middleware(req, res, next) {
  const path = req.url.replace('/_da/', '/');

  const reqUrl = `${process.env.DANSWER_URL}/api${path}`;

  const username = process.env.DANSWER_USERNAME;
  const password = process.env.DANSWER_PASSWORD;

  if (!(username && password)) {
    res.send({
      error: MSG_INVALID_CONFIGURATION,
    });
    return;
  }

  try {
    await send_danswer_request(req, res, { url: reqUrl, username, password });
  } catch (error) {
    // eslint-disable-next-line
    console.error(MSG_ERROR_REQUEST, error?.response?.text);

    res.send({ error: `Danswer error: ${error?.response?.text || 'error'}` });
  }
}
