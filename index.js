const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto')
const exec = require('child_process').exec;

const host = express();
host.use(bodyParser.json());

const processPushEvent = (data) => {
  // TODO: build prod on master push here (or mb leave it for travis - decide)
  console.log('Push event: ', data.ref);
};

const processPullRequest = (data) => {
  console.log('Get pr data', data.action);
  if (data.action && ['opened','synchronize'].includes(data.action)) {
    console.log('Will build it now');
    exec('./builder.sh test',(error, stdout) => {
        console.log(`out: ${stdout}`);
        if (error !== null) {
          console.log(`exec error: ${error}`);
        }
      });
  }
};

const verifyPostData = (req, res, next) => {
  const payload = JSON.stringify(req.body);
  const secret = (process.env.GITSECRET) ? process.env.GITSECRET : 'testsecret';
  const headerKey = 'x-hub-signature';
  if (!payload) {
    return next('Request body empty')
  }
  const hmac = crypto.createHmac('sha1', secret);
  const digest = 'sha1=' + hmac.update(payload).digest('hex');
  const checksum = req.headers[headerKey];
  if (!checksum || !digest || checksum !== digest) {
    return res.status(400).send(`Request body digest (${digest}) did not match ${headerKey} (${checksum})`);
  }
  return next()
};


host.post('/payload', verifyPostData, async (req, res) => {
  if (!req.headers['x-github-event']) {
     return res.status(400).send('Github event headers missing');
  }
  console.log('Headers!', req.headers);
  switch (req.headers['x-github-event']) {
    case 'push': processPushEvent(req.body); break;
    case 'pull_request': processPullRequest(req.body); break;
    default: return res.status(400).send('Wrong github event');
  }

  res.status(200).send('ok');
});

host.listen(8000, () => console.log('Host is up'));