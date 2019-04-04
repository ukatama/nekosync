declare module 'firebase-tools' {
  interface DeployOptions {
    project?: string;
    token?: string;
    cwd?: string;
  }
  export function deploy(options: DeployOptions): Promise<void>;
}
