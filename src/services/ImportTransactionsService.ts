import csvParse from 'csv-parse';
import fs from 'fs';
import { getCustomRepository, getRepository, In } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    // A Stream que vai ler nossos arquivos, passando o caminho do arquivo.
    const contactsReadStream = fs.createReadStream(filePath);

    // instanciando o csv-parse
    const parsers = csvParse({
      // Começar da linha 2 pra não inserir o nome das colunas no db
      from_line: 2,
    });

    // o pipe vai ir lendo as linhas conforme elas forem disponiveis
    const parseCSV = contactsReadStream.pipe(parsers);

    // salvar em variaveis para não ficar colocando um por vez no banco de dados
    // evitando que abra e fecha conexões desnecessárias
    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        // trim remove os espaços em branco
        cell.trim(),
      );

      // se algum dos 3 não existiram, retornar
      if (!title || !type || !value) return;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    // esperar o fim do da execução do parseCSV para continuar
    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    // Retornando todas categorias menos aquelas que foram encontradas acima
    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      // Evitando que tenha categorias repetidas
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(createdTransactions);

    // apagando arquivo da pasta tmp
    await fs.promises.unlink(filePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
