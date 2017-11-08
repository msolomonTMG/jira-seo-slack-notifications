const request = require('request');

var helpers = {

}

var functions = {
  /*
   * Send messages to slack channels
   * @param {array} urls - URLs (webhooks) to send slack messages to
   * @param {string} text - The text of the slack message
   * @param {array} attachments - Array of objects for slack attachments
  */
  sendMessage: function(urls, text, attachments) {
    return new Promise(function(resolve, reject) {

      let postData = {
        text: text,
        attachments: attachments
      }

      urls.forEach((url, index) => {
        let isFinalUrl = urls.length == index + 1

        let options = {
          method: 'post',
          body: postData,
          json: true,
          url: url
        }

        request(options, function(err, res, body) {
          if (err) {
            console.error('error posting json: ', err)
            if ( isFinalUrl ) {
              return reject(err)
            }
          } else {
            console.log('alerted Slack')
            if ( isFinalUrl ) {
              return resolve(true)
            }
          }
        })

      })

    })
  }
}

module.exports = functions;
