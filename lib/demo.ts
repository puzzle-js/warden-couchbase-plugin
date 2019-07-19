import {CouchbaseCache} from "./couchbase-cache";

const couchbasePlugin = new CouchbaseCache({
  username: 'Administrator',
  password: 'D9W1TJXuUhsW',
  host: 'memcached://10.10.41.205:11210',
  timeout: 10000,
  bucketName: 'warden'
});

const lorem = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum";


couchbasePlugin.connect()
  .then(() => {
    console.log('Connected');
    couchbasePlugin.set('key', lorem).then((data: any) => {
      console.log('set', data);
      couchbasePlugin.get('key').then((data: any) => {
        console.log('get', data);
      });
    });

  });
