import redis from 'redis';
import promise from 'thenify';

const client = redis.createClient();

export async function get(key) {
  const value = await promise((...c)=>client.get(...c))(key);

  return !!value ? JSON.parse(value) : null;
}

export function set(key, value) {
  client.set(key, JSON.stringify(value));
}
