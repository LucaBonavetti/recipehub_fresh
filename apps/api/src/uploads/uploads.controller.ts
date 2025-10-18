import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const MAX_SIZE = 2 * 1024 * 1024; // 2 MiB

function ensureUploadsDir() {
  const dir = join(process.cwd(), 'uploads');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

// Type the callback explicitly to what Multer expects here (error, acceptFile)
function imageFileFilter(
  req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!file?.mimetype?.startsWith?.('image/')) {
    return cb(new BadRequestException('Only image files are allowed') as any, false);
  }
  cb(null, true);
}

@Controller('api/uploads')
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(null, ensureUploadsDir());
        },
        filename: (req, file, cb) => {
          const name = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname || '').toLowerCase();
          cb(null, `${name}${ext}`);
        },
      }),
      fileFilter: imageFileFilter,
      limits: { fileSize: MAX_SIZE },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const path = `/uploads/${file.filename}`;
    return { ok: true, path, size: file.size, mime: file.mimetype };
    // Note: We only return the path; the frontend stores it on the recipe.
  }
}
