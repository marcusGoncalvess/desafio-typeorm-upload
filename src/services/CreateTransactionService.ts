import { getCustomRepository, getRepository } from 'typeorm';
import TransactionRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError('You do not have enough balance');
    }

    const categoryAlreadyExists = await categoryRepository.findOne({
      where: { title: category },
    });

    let category_id;

    if (!categoryAlreadyExists) {
      const newCategory = categoryRepository.create({
        title: category,
      });
      await categoryRepository.save(newCategory);
      category_id = newCategory.id;
    } else {
      category_id = categoryAlreadyExists.id;
    }

    const transaction = await transactionsRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
