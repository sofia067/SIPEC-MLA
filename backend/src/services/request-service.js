import { AppError } from '../errors/app-error.js';
import { requestRepository } from '../repositories/request-repository.js';
import { getAreaScope } from '../middleware/role-scope.js';

export const requestService = {
  async create(input, user) {
    const areaName = getAreaScope(user);
    const normalizedInput = {
      ...input,
      department: (areaName || input.department).trim(),
      positionTitle: input.positionTitle.trim(),
      reason: input.reason.trim(),
    };

    if (normalizedInput.requiredBy && normalizedInput.requiredBy < new Date().toISOString().slice(0, 10)) {
      throw new AppError(400, 'INVALID_REQUIRED_DATE', 'La fecha requerida no puede estar en el pasado.');
    }
    if (normalizedInput.applicationDeadline <= new Date().toISOString().slice(0, 10)) {
      throw new AppError(400, 'INVALID_APPLICATION_DEADLINE', 'La fecha de cierre debe ser posterior a hoy.');
    }

    return requestRepository.create({ ...normalizedInput, userId: user.id });
  },

  async getDashboard(user) {
    const areaName = getAreaScope(user);
    const [summary, requests] = await Promise.all([
      requestRepository.getDashboardSummary(areaName),
      requestRepository.listRecent(10, areaName),
    ]);
    return { summary, requests };
  },
};
