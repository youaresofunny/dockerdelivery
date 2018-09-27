const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto')
const exec = require('child_process').exec;
const { JSDOM } = require('jsdom');  
const fs = require('fs');


const host = express();
host.use(bodyParser.json());

const updateBuilderPage = (refname, status) => {
  const html = fs.readFileSync("./active/index.html", "utf8");
  const { document: doc} = (new JSDOM(html)).window;
  const container = doc.getElementById('container');
  const ref = doc.getElementById(refname);
  if (ref) {
    ref.innerHTML = `Branch: ${refname}, link: http://staging-ui.trusty.apasia.tech:8080/${refname}, status: ${status}`;
  } else {
    container.innerHTML += `<div id='${refname}'>Branch: ${refname}, link: http://staging-ui.trusty.apasia.tech:8080/${refname}, status: ${status}</div>`;
  }
  fs.writeFileSync('./active/index.html', doc.documentElement.outerHTML);
}

const processPushEvent = (data) => {
  // TODO: build prod on master push here (or mb leave it for travis - decide)
  console.log('Push event: ', data.ref);
};

const processPullRequest = (data) => {
  console.log('Get pr data', data.action);
  if (data.action && ['opened','synchronize'].includes(data.action)) {
    const { pull_request: { head: { ref }}} = data;
    console.log('Will build it now', ref);
    updateBuilderPage(ref, 'building');
    exec(`./builder.sh ${ref}`,(error, stdout) => {
      console.log(`out: ${stdout}`);
      if (error !== null) {
        updateBuilderPage(ref, 'fail');
      } else {
        updateBuilderPage(ref, 'done');
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
    console.log('Signature mismatch');
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

host.get('/test', async (req, res) => {
  res.status(200).send('ok');
  const ref = 'builder';
  updateBuilderPage(ref, 'building');
  exec(`./builder.sh ${ref}`,(error, stdout) => {
    console.log(`out: ${stdout}`);
    if (error !== null) {
      console.log('WTF!', error);
      updateBuilderPage(ref, 'fail');
    } else {
      updateBuilderPage(ref, 'done');
    }
  });
});

host.listen(8000, () => console.log('Host is up'));

process.on('SIGINT', process.exit);
