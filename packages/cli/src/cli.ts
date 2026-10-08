export const VERSION = '0.1.0';

export async function main(argv: string[]): Promise<number> {
  if (argv.includes('--version')) {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }
  return 0;
}
