import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';

@Controller('test-files')
export class TestFilesController {
  private readonly uploadPath = join(process.cwd(), 'uploads', 'test-files');

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Файл не предоставлен');
    }

    // В реальном проекте здесь была бы загрузка в облачное хранилище
    // Пока просто возвращаем URL для тестирования
    const fileUrl = `${process.env.RENDER_EXTERNAL_URL || 'https://airshorts1.onrender.com'}/test-files/${file.originalname}`;

    return {
      success: true,
      message: 'Файл загружен успешно',
      fileUrl,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Get(':filename')
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    // В реальном проекте здесь был бы доступ к файлу из облачного хранилища
    // Пока используем локальные файлы из src/test/
    const localPath = join(process.cwd(), 'src', 'test', filename);

    if (!existsSync(localPath)) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    const fileStream = createReadStream(localPath);
    fileStream.pipe(res);
  }

  @Get('list')
  async listFiles() {
    // Возвращаем список доступных тестовых файлов
    return {
      files: [
        {
          name: 'myava.jpeg',
          url: `${process.env.RENDER_EXTERNAL_URL || 'https://airshorts1.onrender.com'}/test-files/myava.jpeg`,
          type: 'image/jpeg',
        },
        {
          name: 'audio_me.ogg',
          url: `${process.env.RENDER_EXTERNAL_URL || 'https://airshorts1.onrender.com'}/test-files/audio_me.ogg`,
          type: 'audio/ogg',
        },
      ],
    };
  }
}
