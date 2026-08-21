import * as authService from './auth.service.js';

export async function register(req, res) {
  const result = await authService.register(req.body);
  res.status(201).json({ success: true, data: result });
}

export async function login(req, res) {
  const result = await authService.login(req.body);
  res.json({ success: true, data: result });
}

export async function me(req, res) {
  const user = await authService.getProfile(req.user.id);
  res.json({ success: true, data: user });
}
