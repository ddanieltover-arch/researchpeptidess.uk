import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import type { MappedImage } from './wc-types';
import { PUBLIC_PRODUCTS_DIR } from './paths';

const execFileAsync = promisify(execFile);
const CURL = process.platform === 'win32' ? 'curl.exe' : 'curl';
const USER_AGENT = 'Mozilla/5.0';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pad(index: number): string {
  return String(index + 1).padStart(2, '0');
}

async function downloadBuffer(url: string): Promise<Buffer> {
  const tmp = path.join(os.tmpdir(), `wc-img-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  try {
    await execFileAsync(
      CURL,
      [
        '-sS',
        '-L',
        '-A',
        USER_AGENT,
        '-H',
        'Referer: https://researchpeptide.co.uk/',
        '-H',
        'Accept: image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        '-o',
        tmp,
        url,
      ],
      { timeout: 60000 }
    );
    const raw = await fs.readFile(tmp);
    if (raw.length < 100) {
      throw new Error(`Empty image body ${url}`);
    }
    return raw;
  } finally {
    await fs.unlink(tmp).catch(() => undefined);
  }
}

export async function attachExistingLocalImages(
  slug: string,
  altText: string
): Promise<MappedImage[]> {
  const dir = path.join(PUBLIC_PRODUCTS_DIR, slug);
  try {
    const files = (await fs.readdir(dir))
      .filter((file) => /\.(webp|jpe?g|png)$/i.test(file))
      .sort();
    return files.map((file, index) => ({
      sourceUrl: `/products/${slug}/${file}`,
      localPath: path.join(dir, file),
      publicUrl: `/products/${slug}/${file}`,
      altText,
      sortOrder: index,
      isPrimary: index === 0,
    }));
  } catch {
    return [];
  }
}

export async function ensureLocalImages(
  slug: string,
  images: MappedImage[],
  onProgress?: (label: string) => void,
  skipDownload = false
): Promise<MappedImage[]> {
  const altText = images[0]?.altText || slug;
  const existing = await attachExistingLocalImages(slug, altText);
  if (existing.length > 0 && (skipDownload || existing.length >= images.length || images.length === 0)) {
    return existing;
  }
  if (skipDownload) return existing;
  return rehostImages(slug, images, onProgress);
}

export async function rehostImages(
  slug: string,
  images: MappedImage[],
  onProgress?: (label: string) => void
): Promise<MappedImage[]> {
  const dir = path.join(PUBLIC_PRODUCTS_DIR, slug);
  await fs.mkdir(dir, { recursive: true });
  const hosted: MappedImage[] = [];

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const role = image.isPrimary ? 'primary' : 'gallery';
    const filename = `${pad(i)}-${role}.webp`;
    const dest = path.join(dir, filename);
    onProgress?.(`${slug} ${filename}`);

    try {
      const raw = await downloadBuffer(image.sourceUrl);
      await sharp(raw)
        .rotate()
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(dest);
      hosted.push({
        ...image,
        localPath: dest,
        publicUrl: `/products/${slug}/${filename}`,
      });
    } catch (error) {
      const fallbackName = `${pad(i)}-${role}.jpg`;
      const fallbackDest = path.join(dir, fallbackName);
      try {
        const raw = await downloadBuffer(image.sourceUrl);
        await fs.writeFile(fallbackDest, raw);
        hosted.push({
          ...image,
          localPath: fallbackDest,
          publicUrl: `/products/${slug}/${fallbackName}`,
        });
      } catch {
        hosted.push(image);
      }
      console.warn(`Image fallback for ${slug}:`, error instanceof Error ? error.message : error);
    }

    await sleep(80);
  }

  return hosted;
}
