import { AppError } from '../errors/app-error.js';
import { requestRepository } from '../repositories/request-repository.js';

export const requestService = {
  async create(input, userId) {
    const normalizedInput = {
      ...input,
      department: input.department.trim(),
      positionTitle: input.positionTitle.trim(),
      reason: input.reason.trim(),
    };

    if (normalizedInput.requiredBy && normalizedInput.requiredBy < new Date().toISOString().slice(0, 10)) {
      throw new AppError(400, 'INVALID_REQUIRED_DATE', 'La fecha requerida no puede estar en el pasado.');
    }

    return requestRepository.create({ ...normalizedInput, userId });
  },

  async getDashboard() {
    const [summary, requests] = await Promise.all([
      requestRepository.getDashboardSummary(),
      requestRepository.listRecent(),
    ]);
    return { summary, requests };
  },
};
