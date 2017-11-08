'use strict';

const
  express = require('express'),
  bodyParser = require('body-parser'),
  slack = require('./slack'),
  seoSlackChannel = process.env.SLACK_CHANNEL_SEO,
  request = require('request');

var app = express();
app.set('port', process.env.PORT || 5000);

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.post('/', function(req, res) {
  switch(req.body.webhookEvent) {
    case 'comment_created':
      sendCommentNotification(req, res)
      break;
    case 'issue_created':
      sendIssueCreatedNotification(req, res) 
      break;
    default:
      res.send(200)
  }
})

function sendCommentNotification(req, res) {
  let comment = req.body.comment,
      issue = req.body.issue,
      jiraURL = issue.self.split('/rest/api')[0];

  let text = `${comment.author.displayName} commented on an issue`
  let attachments = [
    {
      fallback: `${comment.author.displayName} commented on <${jiraURL}/browse/${issue.key}|${issue.key}: ${issue.fields.summary}>`,
      title: `<${jiraURL}/browse/${issue.key}|${issue.key}: ${issue.fields.summary}>`,
      thumb_url: `${comment.author.avatarUrls["48x48"]}`,
      fields: [
        {
          title: "Comment",
          value: `${comment.body}`,
          short: false
        }
      ]
    }
  ]
  slack.sendMessage([seoSlackChannel], text, attachments)
    .then(success => { res.send(200) })
    .catch(err => {res.send(500) })
}

function sendIssueCreatedNotification(req, res) {
  let text,
      color,
      issue = req.body.issue,
      jiraURL = issue.self.split('/rest/api')[0];

  let attachments = [
    {
      fallback: `${issue.fields.creator.name} created <${jiraURL}/browse/${issue.key}|${issue.key}: ${issue.fields.summary}>`,
      title: `<${jiraURL}/browse/${issue.key}|${issue.key}: ${issue.fields.summary}>`,
      thumb_url: `${issue.fields.creator.avatarUrls["48x48"]}`,
      fields: [
        {
          title: "Description",
          value: `${issue.fields.description}`,
          short: false
        }
      ]
    }
  ]

  let urls = [seoSlackChannel]
  slack.sendMessage(urls, text, attachments)
    .then(success => { res.send(200) })
    .catch(err => {res.send(500) })
}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
module.exports = app;
