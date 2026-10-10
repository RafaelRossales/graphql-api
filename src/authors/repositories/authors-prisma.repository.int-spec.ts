/// <reference types="jest" />

import { TestingModule, Test } from '@nestjs/testing'
import { AuthorsPrismaRepository } from './authors-prisma.repository'
import { PrismaService } from '@/database/prisma/prisma.service'
import { execSync } from 'node:child_process'
import { PrismaClient } from '@/generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { NotFoundError } from '@/shared/errors/not-found-error'
import { ICreateAuthor } from '../interfaces/create-author'
import { AuthorDataBuilder } from '../helpers/author-data-builder'
import { Author } from '../graphql/models/author'

describe('AuthorsPrismaRepository Integration Tests', () => {
  let repository: AuthorsPrismaRepository
  let module: TestingModule
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  })

  beforeAll(async () => {
    execSync('npm run prisma:migratetest')
    await prisma.$connect()
    module = await Test.createTestingModule({}).compile()
    repository = new AuthorsPrismaRepository(prisma as unknown as PrismaService)
  })

  beforeEach(async () => {
    await prisma.author.deleteMany()
  })

  afterAll(async () => {
    await module.close()
  })

  test('should throw an error when the id is not found', async () => {
    const id: string = 'ee5814c2-2af8-4a3c-b439-035d7c422de8'
    await expect(repository.findById(id)).rejects.toThrow(
      new NotFoundError(`Author not found using ID ${id}`),
    )
  })

  test('should find an author by id', async () => {
    const data: ICreateAuthor = AuthorDataBuilder({})
    const author = await prisma.author.create({ data })
    const result = await repository.findById(author.id)
    expect(result).toStrictEqual(author)
  })

  test('should create an author', async () => {
    const data: ICreateAuthor = AuthorDataBuilder({})
    const author = await repository.create(data)
    expect(author).toMatchObject(author)
  })
})
