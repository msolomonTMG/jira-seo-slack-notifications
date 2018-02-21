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

app.get('/', function(req, res) {
  //wake up
  res.sendStatus(200)
})

app.post('/', function(req, res) {
  console.log('----------PINGED----------')
  console.log(req.body)
  console.log(req.body.changelog)
  switch(req.body.webhookEvent) {
    case 'jira:issue_updated':

      switch(req.body.issue_event_type_name) {
        case 'issue_commented':
          sendCommentNotification(req, res)
          break;
        case 'issue_generic':
          req.body.changelog.items.forEach(item => {
            if (item.field && item.field == 'status' && item.toString.match(/Done|Closed/)) {
              sendDoneNotification(req, res)
              return
            } else {
              res.sendStatus(200)
            }
          })
          break;
        default:
          res.sendStatus(200)
      }
      break;

    case 'jira:issue_created':
      sendIssueCreatedNotification(req, res)
      break;
    default:
      res.sendStatus(200)
  }
})

function sendDoneNotification(req, res) {
  let issue = req.body.issue,
      user = req.body.user,
      jiraURL = issue.self.split('/rest/api')[0];

  let text = `${user.displayName} transitioned an issue to ${issue.fields.status.name}`
  let attachments = [
    {
      fallback: `${user.displayName} transitioned <${jiraURL}/browse/${issue.key}|${issue.key}: ${issue.fields.summary}> to ${issue.fields.status.name}`,
      title: `<${jiraURL}/browse/${issue.key}|${issue.key}: ${issue.fields.summary}>`,
      color: 'good',
      thumb_url: `${user.avatarUrls["48x48"]}`,
      fields: [
        {
          title: "Resolution",
          value: `${issue.fields.resolution.name}`,
          short: false
        }
      ]
    }
  ]
  slack.sendMessage([seoSlackChannel], text, attachments)
    .then(success => { console.log('----------SUCCESSFULLY SENT TO SLACK----------'); res.sendStatus(200) })
    .catch(err => { console.log('----------ERROR SENDING TO SLACK----------'); console.log(err); res.sendStatus(500) })
}

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
    .then(success => { res.sendStatus(200) })
    .catch(err => {res.sendStatus(500) })
}

function sendIssueCreatedNotification(req, res) {
  let color,
      issue = req.body.issue,
      jiraURL = issue.self.split('/rest/api')[0];

  let text = `${issue.fields.creator.displayName} created an issue`
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
    .then(success => { res.sendStatus(200) })
    .catch(err => {res.sendStatus(500) })
}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
module.exports = app;
