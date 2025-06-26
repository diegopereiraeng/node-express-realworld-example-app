import {
  randEmail,
  randFullName,
  randLines,
  randParagraph,
  randPassword,
  randPhrase,
  randWord,
} from '@ngneat/falso';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { RegisteredUser } from '../app/routes/auth/registered-user.model';
import { createUser } from '../app/routes/auth/auth.service';
import { addComment, createArticle } from '../app/routes/article/article.service';

const prisma = new PrismaClient();

// Generate unique users
export const generateUser = async (): Promise<RegisteredUser> =>
  createUser({
    username: randFullName(),
    email: randEmail(),
    password: randPassword(),
    image: 'https://api.realworld.io/images/demo-avatar.png',
    demo: true,
  });

// Generate unique articles
const generateArticle = async (authorId: number) =>
  createArticle(
    {
      title: `${randPhrase()} ${uuidv4().slice(0, 8)}`,
      description: randParagraph(),
      body: randLines({ length: 10 }).join(' '),
      tagList: randWord({ length: 4 }),
      slug: `${randWord()}-${uuidv4().slice(0, 8)}`, // Ensure unique slug
    },
    authorId,
  );

// Generate a comment
export const generateComment = async (userId: number, slug: string) =>
  addComment(randParagraph(), slug, userId);

// Main seeding logic
const main = async () => {
  try {
    // Create known fixed test user
    const existing = await prisma.user.findUnique({
      where: { email: 'realworld@me' },
    });

    if (!existing) {
      await createUser({
        username: 'RealWorld',
        email: 'realworld@me',
        password: 'test123',
        image: 'https://api.realworld.io/images/smiley-cyrus.jpeg',
        demo: true,
      });
    }

    // Generate 12 users
    const users = await Promise.all(
      Array.from({ length: 12 }, () => generateUser())
    );

    // For each user, generate 12 articles with unique slugs
    for (const user of users) {
      const articles = await Promise.all(
        Array.from({ length: 12 }, () => generateArticle(user.id))
      );

      // For each article, add comments from all users
      for (const article of articles) {
        await Promise.all(
          users.map((userItem) =>
            generateComment(userItem.id, article.slug)
          )
        );
      }
    }
  } catch (e) {
    console.error('❌ Seed error:', e);
  } finally {
    await prisma.$disconnect();
  }
};

main().catch(() => process.exit(1));
