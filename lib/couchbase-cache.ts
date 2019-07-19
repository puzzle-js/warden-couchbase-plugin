import {Bucket, Cluster} from "couchbase";
import * as zlib from "zlib";

interface CouchbaseCacheOptions {
  host: string;
  bucketName: string;
  username?: string;
  password?: string;
  timeout?: number;
  compression?: boolean;
}

interface CachePlugin {
  get<T>(key: string): Promise<T | null>;

  set(key: string, value: unknown, ms?: number): Promise<void>;
}

class CouchbaseCache implements CachePlugin {
  private cluster!: Cluster;
  private bucket!: Bucket;
  private options: CouchbaseCacheOptions;

  constructor(options: CouchbaseCacheOptions) {
    this.options = options;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.cluster = new Cluster(this.options.host);
      if (this.options.username && this.options.password) {
        this.cluster.authenticate(
          this.options.username,
          this.options.password,
        );
      }
      this.bucket = this.cluster.openBucket(this.options.bucketName);
      this.bucket.on('connect', resolve);
      this.bucket.on('error', reject);
      this.configure();
    });
  }

  private configure() {
    if (this.options.timeout) {
      this.bucket.operationTimeout = this.options.timeout;
    }
  }

  get<T>(key: string): Promise<any> {
    return new Promise(resolve => {
      this.bucket.get(key, (err, data) => {
        const cached = data && data.value ? data : null;
        if (!cached) {
          resolve(null);
        } else {
          if (this.options.compression) {
            zlib.unzip(cached.value, (err, buffer) => {
              if(err || !buffer) return resolve(null);
              resolve(JSON.parse(buffer.toString('utf8')));
            });
          } else {
            resolve(cached.value)
          }
        }
      });
    });
  }

  set(key: string, value: unknown, ms?: number): Promise<void> {
    return new Promise(resolve => {
      if (this.options.compression) {
        zlib.gzip(JSON.stringify(value), (err, buffer) => {
          this.insert(key, buffer, resolve, ms)
        });
      } else {
        this.insert(key, value as string, resolve, ms)
      }
    });
  }

  private insert(key: string, value: string | Buffer, cb: () => void, ms?: number) {
    this.bucket.insert(key, value, {
      expiry: ms ? Math.floor(ms / 1000) : undefined
    }, cb);
  }
}

export {
  CouchbaseCache,
  CouchbaseCacheOptions
}
