import 'babel-polyfill';
// import path from 'path';
// import phantomjs from 'phantomjs-prebuilt';
import { getRandomUser, getVote } from 'cocorico-test';

async function main() {
  var vote = await getVote();

  console.log(vote);

  // var program = phantomjs.exec(path.resolve('./src/VoteWidgetTest.js'), '--ignore-ssl-errors=true');
  //
  // program.stdout.pipe(process.stdout);
  // program.stderr.pipe(process.stderr);
  // program.on('exit', code => {
  //   // do something on end
  //   process.exit(code);
  // });
}

main();
