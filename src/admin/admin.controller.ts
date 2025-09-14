import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AdminService } from './admin.service';
import type { AdminSessionRequest } from './types';

@Controller('adminka')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  root(@Req() req: AdminSessionRequest, @Res() res: Response) {
    const isAuth = req.session?.isAdmin === true;
    const isNotAuth = isAuth === false;
    if (isNotAuth === true) {
      return res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Админка — вход</title></head><body>
        <h1>Вход в админку</h1>
        <form method="post" action="/adminka/login">
          <input type="password" name="password" placeholder="Пароль" />
          <button type="submit">Войти</button>
        </form>
      </body></html>`);
    } else {
      return res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Админка</title></head><body>
      <h1>Админка</h1>
      <ul>
        <li><a href="/adminka/logs">Логи действий</a></li>
        <li><a href="/adminka/metrics">Метрики</a></li>
        <li><a href="/adminka/db">Таблицы БД</a></li>
      </ul>
      <form method="post" action="/adminka/logout"><button type="submit">Выйти</button></form>
    </body></html>`);
    }
  }

  @Post('login')
  login(@Body('password') password: string, @Req() req: AdminSessionRequest, @Res() res: Response) {
    const isPasswordValid = this.adminService.isPasswordValid(password) === true;
    if (isPasswordValid === true) {
      req.session = req.session || {};
      req.session.isAdmin = true;
      return res.redirect('/adminka');
    }
    return res.status(401).send('Неверный пароль');
  }

  @Post('logout')
  logout(@Req() req: AdminSessionRequest, @Res() res: Response) {
    const isSessionPresent = req.session !== undefined && req.session !== null;
    if (isSessionPresent === true) {
      req.session.isAdmin = false;
    }
    return res.redirect('/adminka');
  }
}
