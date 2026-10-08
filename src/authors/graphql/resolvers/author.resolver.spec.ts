import { AuthorResolver } from './author.resolver'
import { Test, TestingModule } from '@nestjs/testing'

describe('AuthorResolver', () => {
  let resolver: AuthorResolver

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthorResolver],
    }).compile()

    resolver = module.get<AuthorResolver>(AuthorResolver)
  })

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })
})
