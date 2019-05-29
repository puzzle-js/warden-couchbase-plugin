import {Bucket, Cluster} from "couchbase";

interface CouchbaseCacheOptions {
  host: string;
  bucketName: string;
  username?: string;
  password?: string;
  timeout?: number;
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

  get<T>(key: string): Promise<T | null> {
    return new Promise(resolve => {
      this.bucket.get(key, (err, data) => {
        resolve(data && data.value ? data.value : null);
      });
    });
  }

  set(key: string, value: unknown, ms?: number): Promise<void> {
    return new Promise(resolve => {
      this.bucket.insert(key, value, {
        expiry: ms ? Math.floor(ms / 1000) : undefined
      }, _ => {
        resolve();
      });
    });
  }
}

export {
  CouchbaseCache,
  CouchbaseCacheOptions
}
