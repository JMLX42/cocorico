import delay from 'timeout-as-promise';
import webpage from 'webpage';

var page = webpage.create();

page.settings.userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/53.0.2785.143 Chrome/53.0.2785.143 Safari/537.36';

page.viewportSize = {
  width: 800,
  height: 400,
};

page.onConsoleMessage = function(msg, lineNum, sourceId) {
  console.log('> ' + msg);
};

page.onError = function(msg, trace) {
  var msgStack = ['ERROR: ' + msg];

  if (trace && trace.length) {
    msgStack.push('TRACE:');
    trace.forEach(function(t) {
      msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''));
    });
  }

  console.error(msgStack.join('\n'));
  phantom.exit(1);
};

page.open(
  'https://local.cocorico.cc/',
  async (status) => {
    if (status === 'success') {
      await delay(1000);

      page.includeJs(
        'https://code.jquery.com/jquery-3.1.1.min.js',
        async () => {
          page.render('step_0.png');
          page.evaluate(() => {
            $('#btn-vote-confirm-id').click();
          });
          page.render('step_1.png');
          page.evaluate(() => {
            $('input:radio')[0].click();
            $('#btn-vote-submit-ballot-value').click();
          });
          page.render('step_2.png');

          await delay(12000);

          page.render('step_3.png');
          page.evaluate(() => {
            $('#btn-vote-confirm-ballot').click();
          });
          page.render('step_4.png');

          await delay(10000);

          page.render('step_5.png');
          phantom.exit();
        }
      );
    } else {
      phantom.exit(1);
    }
  }
);
