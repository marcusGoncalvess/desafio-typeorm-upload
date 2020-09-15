import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionsRepository = await getCustomRepository(
      TransactionRepository,
    );

    const idAlreadyExists = await transactionsRepository.findOne(id);

    if (!idAlreadyExists) {
      throw new AppError('id doesnt exists');
    }

    await transactionsRepository.delete({
      id,
    });
  }
}

export default DeleteTransactionService;
