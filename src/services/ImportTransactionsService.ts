import csvParse from 'csv-parse';
import fs from 'fs';
import { getCustomRepository } from 'typeorm';

import TransactionRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
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
    const transactions = [];
    const categories = [];

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

    return { categories, transactions };
  }
}

export default ImportTransactionsService;
