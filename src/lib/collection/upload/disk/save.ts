import type { ImageSizesConfig } from 'rizom/types/config';
import type { UploadDoc } from 'rizom';
import path from 'path';
import { existsSync, writeFileSync } from 'fs';
import { randomId } from 'rizom/utils/random';
import { RizomError } from 'rizom/errors/index.js';
import { pick } from 'rizom/utils/object';
import sharp from 'sharp';
import { toCamelCase } from 'rizom/utils/string';
import { normalizeFileName } from 'rizom/utils/file';
import type { Dic } from 'rizom/types/utility';

export const saveFile = async (file: File, imagesSizes: ImageSizesConfig[] | false) => {
	const { name: initialName, extension } = normalizeFileName(file.name);
	let name = initialName;
	let sizes: UploadDoc['sizes'] = {};
	let filename = `${name}.${extension}`;
	let filePath = path.resolve(process.cwd(), `static/medias/${filename}`);
	while (existsSync(filePath)) {
		name += `-${randomId(8)}`;
		filename = `${name}.${extension}`;
		filePath = path.resolve(process.cwd(), `static/medias/${filename}`);
	}

	try {
		const buffer = Buffer.from(await file.arrayBuffer());
		writeFileSync(filePath, buffer);
		if (imagesSizes && file.type.includes('image') && !file.type.includes('svg')) {
			sizes = await generateSizes({
				name: name,
				extension,
				sizes: imagesSizes,
				buffer
			});
		}
	} catch (err: any) {
		console.log(err);
		throw new RizomError(RizomError.UPLOAD, 'Error while writing file on disk');
	}
	return { filename, imageSizes: sizes };
};

type GenerateSizeArgs = {
	sizes: ImageSizesConfig[];
	buffer: Buffer;
	name: string;
	extension: string;
};

export const generateSizes = async ({ sizes, buffer, name, extension }: GenerateSizeArgs) => {
	const imageSizes: Dic = {};

	for (const size of sizes) {
		const wh = pick(['width', 'height'], size);
		const resizedImage = sharp(buffer).resize(wh);
		const whString = `${wh.width || ''}${wh.height && wh.width ? 'x' : ''}${wh.height || ''}`;

		// If no output formats specified, keep original format
		if (!size.out?.length) {
			let resizedBuffer: Buffer;
			const shouldApplyCompression =
				size.compression && (extension === 'jpg' || extension === 'webp');

			if (shouldApplyCompression) {
				if (extension === 'jpg') {
					resizedBuffer = await resizedImage.jpeg({ quality: size.compression }).toBuffer();
				} else {
					resizedBuffer = await resizedImage.webp({ quality: size.compression }).toBuffer();
				}
			} else {
				resizedBuffer = await resizedImage.toBuffer();
			}

			const filename = `${name}-${toCamelCase(size.name)}-${whString}.${extension}`;
			const filePath = path.resolve(process.cwd(), `static/medias/${filename}`);
			writeFileSync(filePath, resizedBuffer);
			imageSizes[toCamelCase(size.name)] = filename;
			continue;
		}

		// Handle format conversions
		const convertedFiles = await Promise.all(
			size.out.map(async (format) => {
				const compression = size.compression || 70;
				let convertedImage;

				if (format === 'jpg') {
					convertedImage = await resizedImage.jpeg({ quality: compression }).toBuffer();
				} else {
					convertedImage = await resizedImage.webp({ quality: compression }).toBuffer();
				}

				const filename = `${name}-${toCamelCase(size.name)}-${whString}.${format}`;
				const filePath = path.resolve(process.cwd(), `static/medias/${filename}`);
				writeFileSync(filePath, convertedImage);

				return filename;
			})
		);

		imageSizes[toCamelCase(size.name)] = convertedFiles.join('|');
	}

	return imageSizes;
};
