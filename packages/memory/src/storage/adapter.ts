export interface DirEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

export interface FileSystemAdapter {
  readText(path: string): Promise<string>;
  writeText(path: string, contents: string): Promise<void>;
  mkdir(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  readDir(path: string): Promise<DirEntry[]>;
  remove(path: string): Promise<void>;
}
