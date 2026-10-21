/// <reference types="jest" />

import { TestingModule, Test } from '@nestjs/testing'
import { AuthorsPrismaRepository } from '../repositories/authors-prisma.repository'
import { PrismaService } from '@/database/prisma/prisma.service'
import { execSync } from 'node:child_process'
import { PrismaClient } from '@/generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { NotFoundError } from '@/shared/errors/not-found-error'
import { ICreateAuthor } from '../interfaces/create-author'
import { AuthorDataBuilder } from '../helpers/author-data-builder'
import { Author } from '../graphql/models/author'
import { CreateAuthorUseCase } from './create-author.usescase'

describe('CreateAuthorUseCase Integration Tests', () => {
  let repository: AuthorsPrismaRepository
  let module: TestingModule
  let usecase: CreateAuthorUseCase.UseCase
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  })

  beforeAll(async () => {
    execSync('npm run prisma:migratetest')
    await prisma.$connect()
    module = await Test.createTestingModule({}).compile()
    repository = new AuthorsPrismaRepository(prisma as unknown as PrismaService)
    usecase = new CreateAuthorUseCase.UseCase(repository)
  })

  beforeEach(async () => {
    await prisma.author.deleteMany()
  })

  afterAll(async () => {
    await module.close()
  })

  test('should create an author', async () => {
    const data: ICreateAuthor = AuthorDataBuilder({})
    const author = await usecase.execute(data)
    expect(author.id).toBeDefined()
    expect(author.createdAt).toBeInstanceOf(Date)
    expect(author).toMatchObject(data)
  })
})
