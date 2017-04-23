import fs from 'fs';

const config = JSON.parse(fs.readFileSync('/opt/cocorico/api-web/config.json'));

export default config;
