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

  test('should throw an error when updating an author not found', async () => {
    const data = AuthorDataBuilder({})
    const id: string = 'ee5814c2-2af8-4a3c-b439-035d7c422de8'
    const author = {
      id,
      ...data,
    }
    await expect(repository.update(author)).rejects.toThrow(
      new NotFoundError(`Author not found using ID ${id}`),
    )
  })

  test('should update an author', async () => {
    const data: ICreateAuthor = AuthorDataBuilder({})
    const author = await prisma.author.create({ data })
    const result = await repository.update({
      ...author,
      name: 'new name',
    })
    expect(result.name).toBe('new name')
  })

  describe('search method', () => {
    test('should only apply pagination when the parameters are null', async () => {
      const createdAt = new Date()
      const arrange: ICreateAuthor[] = Array.from({ length: 16 }, () =>
        AuthorDataBuilder({}),
      )

      const data = arrange.map((element, index) => ({
        ...element,
        email: `author${index}@a.com`,
        createdAt: new Date(createdAt.getTime() + index),
      }))

      await prisma.author.createMany({ data })
      const result = await repository.search({})

      expect(result.total).toBe(16)
      expect(result.items.length).toBe(15)
      result.items.forEach(item => {
        expect(item.id).toBeDefined()
      })

      result.items.reverse().forEach((item, index) => {
        expect(`${item.email}${index + 1}@a.com`)
      })
    })

    test('should only apply pagination and ordering', async () => {
      const createdAt = new Date()
      const arrange: ICreateAuthor[] = 'badec'
        .split('')
        .map((element, index) => ({
          ...AuthorDataBuilder({ name: element }),
          email: `author${index}@a.com`,
          createdAt: new Date(createdAt.getTime() + index),
        }))

      await prisma.author.createMany({ data: arrange })
      const result1 = await repository.search({
        page: 1,
        perPage: 2,
        sort: 'name',
        sortDir: 'asc',
      })

      expect(result1.items[0]).toMatchObject(arrange[1])
      expect(result1.items[1]).toMatchObject(arrange[0])

      const result2 = await repository.search({
        page: 2,
        perPage: 2,
        sort: 'name',
        sortDir: 'asc',
      })

      expect(result2.items[0]).toMatchObject(arrange[4])
      expect(result2.items[1]).toMatchObject(arrange[2])
    })

    test('should only apply pagination, filter and ordering', async () => {
      const createdAt = new Date()
      const arrange: ICreateAuthor[] = ['test', 'a', 'TEST', 'b', 'Test'].map(
        (element, index) => ({
          ...AuthorDataBuilder({ name: element }),
          email: `author${index}@a.com`,
          createdAt: new Date(createdAt.getTime() + index),
        }),
      )

      await prisma.author.createMany({ data: arrange })
      const result1 = await repository.search({
        page: 1,
        perPage: 2,
        sort: 'name',
        sortDir: 'asc',
        filter: 'TEST',
      })

      expect(result1.items[0]).toMatchObject(arrange[0])
      expect(result1.items[1]).toMatchObject(arrange[4])

      const result2 = await repository.search({
        page: 2,
        perPage: 2,
        sort: 'name',
        sortDir: 'asc',
        filter: 'TEST',
      })

      expect(result2.items[0]).toMatchObject(arrange[2])
      expect(result2.items.length).toBe(1)
    })
  })
})
