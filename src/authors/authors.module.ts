import { DatabaseModule } from '@/database/database.module'
import { Module } from '@nestjs/common'
import { AuthorResolver } from './graphql/resolvers/author.resolver'
import { PrismaService } from '@/database/prisma/prisma.service'
import { AuthorsPrismaRepository } from './repositories/authors-prisma.repository'

@Module({
  imports: [DatabaseModule],
  providers: [
    AuthorResolver,
    {
      provide: 'PrismaService',
      useClass: PrismaService,
    },
    {
      provide: 'AuthorsRepository',
      useFactory: (prisma: PrismaService) => {
        return new AuthorsPrismaRepository(prisma)
      },
      inject: ['PrismaService'],
    },
  ],
})
export class AuthorsModule {}
