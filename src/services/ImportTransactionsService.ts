import { getCustomRepository } from 'typeorm';

import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';

import TransactionRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';

class ImportTransactionsService {
  async execute(): Promise<Transaction[]> {
    const csvFilePath = path.resolve(
      __dirname,
      '../',
      '../',
      'tmp',
      'import_template.csv',
    );
    const readCSVStream = fs.createReadStream(csvFilePath);
    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });
    const parseCSV = readCSVStream.pipe(parseStream);
    const lines: Array<Array<string>> = [];
    const transactions: Transaction[] = [];
    parseCSV.on('data', line => {
      lines.push(line);
    });
    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const transactionsRepository = await getCustomRepository(
      TransactionRepository,
    );

    lines.forEach(async line => {
      const [title, type, value, category] = line;
      const transaction = await transactionsRepository.create({
        title,
        type,
        value,
        category,
      });
      transactions.push(transaction);
      await transactionsRepository.save(transaction);
    });

    return transactions;
  }
}

export default ImportTransactionsService;
