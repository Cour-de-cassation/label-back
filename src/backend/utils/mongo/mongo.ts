import { MongoClient } from 'mongodb';

export { buildMongo, mongo };

const mongo = buildMongo();

function buildMongo() {
  let client: MongoClient;
  let dbName: string;

  return {
    close,
    initialize,
    getDb,
  };

  async function close() {
    await client.close();
  }

  async function initialize({ dbName: newDbName, url }: { dbName: string; url: string }) {
    dbName = newDbName;
    client = await new MongoClient(url, { directConnection: true }).connect();

    return client;
  }

  function getDb() {
    return client.db(dbName);
  }
}
