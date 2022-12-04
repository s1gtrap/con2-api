const UTM = require('utm-latlng');
const utm = new UTM();
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

const stops = {};
rl.on('line', function (line) {
  const tuple = line.split(';');
  if (tuple.length === 4) {
    const id = tuple[0];
    const name = JSON.parse(tuple[1]);
    const x = Number(tuple[2]);
    const y = Number(tuple[3]);
    const { lat, lng } = utm.convertUtmToLatLng(Number(x), Number(y), 32, 'N');
    stops[tuple[0]] = { id, name, lat, lng };
  }
});

rl.on('close', () => {
  console.log(JSON.stringify(stops));
});
