import {
  randEmail,
  randFullName,
  randLines,
  randParagraph,
  randPassword, randPhrase,
  randWord
} from '@ngneat/falso';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { RegisteredUser } from '../app/routes/auth/registered-user.model';
import { createUser } from '../app/routes/auth/auth.service';
import { addComment, createArticle } from '../app/routes/article/article.service';

const prisma = new PrismaClient();

export const generateUser = async (): Promise<RegisteredUser> =>
  createUser({
    username: randFullName(),
    email: randEmail(),
    password: randPassword(),
    image: 'https://api.realworld.io/images/demo-avatar.png',
    demo: true,
  });



export const generateArticle = async (id: number) =>
  createArticle(
    {
      title: randPhrase(),
      description: randParagraph(),
      body: randLines({ length: 10 }).join(' '),
      tagList: randWord({ length: 4 }),
      slug: `${randWord()}-${uuidv4().slice(0, 8)}`, // add this if your slug isn't generated internally
    },
    id,
  );

export const generateComment = async (id: number, slug: string) =>
  addComment(randParagraph(), slug, id);

const main = async () => {
  try {
    const existing = await prisma.user.findUnique({ where: { email: 'realworld@me' } });
    if (!existing) {
      await await createUser({
        username: 'RealWorld',
        email: 'realworld@me',
        password: 'test123', // plaintext input; service should hash
        image: 'https://api.realworld.io/images/smiley-cyrus.jpeg',
        demo: true,
      });
    }
    const users = await Promise.all(Array.from({length: 12}, () => generateUser()));
    users?.map(user => user);

    // eslint-disable-next-line no-restricted-syntax
    for await (const user of users) {
      const articles = await Promise.all(Array.from({length: 12}, () => generateArticle(user.id)));

      // eslint-disable-next-line no-restricted-syntax
      for await (const article of articles) {
        await Promise.all(users.map(userItem => generateComment(userItem.id, article.slug)));
      }
    }
  } catch (e) {
    console.error(e);

  }
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async () => {
    await prisma.$disconnect();
    process.exit(1);
  });
