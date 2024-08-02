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
  const path = req.url.replace('/_da/', '/');

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

  console.log('body', req.url, req.body);

  await handler(url)
    .set('Cookie', cached_auth_cookie)
    .send(req.body)
    .buffer(true)
    // .parse((res, callback) => {
    //   // This function does nothing to avoid parsing
    //   res.setEncoding('binary');
    //   res.data = '';
    //   res.on('data', (chunk) => {
    //     res.data += chunk;
    //   });
    //   res.on('end', () => {
    //     callback(null, Buffer.from(res.data, 'binary'));
    //   });
    // })
    .on('response', (backendRes) => {
      console.log('response');
      // res.set(backendRes.headers);
      res.set('Content-type', 'application/json');
      if (backendRes.type === 'application/json') {
        res.send(backendRes.body);
      } else {
        backendRes.pipe(res);
      }
    })
    .on('error', (error) => {
      // eslint-disable-next-line no-console
      console.error(MSG_ERROR_REQUEST, error.response?.text || error);
      res.send({ error: error.text });
    });

  // res.send({ error: 'nothing yet', path });
}
