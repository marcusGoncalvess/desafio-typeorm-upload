import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async all(): Promise<any> {
    const findRelation = await this.find({
      relations: ['category'],
    });

    return findRelation;
  }

  public async getBalance(): Promise<void> {
    // TODO
  }
}

export default TransactionsRepository;
