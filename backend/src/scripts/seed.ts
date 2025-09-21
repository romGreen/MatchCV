import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const hobbies = [
  { name: 'Basketball', category: 'Sports' },
  { name: 'Photography', category: 'Arts' },
  { name: 'Cooking', category: 'Lifestyle' },
  { name: 'Motorcycles', category: 'Vehicles' },
  { name: 'Hiking', category: 'Outdoor' },
  { name: 'Gaming', category: 'Entertainment' },
  { name: 'Reading', category: 'Lifestyle' },
  { name: 'Yoga', category: 'Fitness' },
  { name: 'Gardening', category: 'Lifestyle' },
  { name: 'Music', category: 'Arts' },
  { name: 'Cycling', category: 'Sports' },
  { name: 'Painting', category: 'Arts' },
  { name: 'Swimming', category: 'Sports' },
  { name: 'Drawing', category: 'Arts' },
  { name: 'Baking', category: 'Lifestyle' },
  { name: 'Cars', category: 'Vehicles' },
  { name: 'Camping', category: 'Outdoor' },
  { name: 'Board Games', category: 'Entertainment' },
  { name: 'Writing', category: 'Arts' },
  { name: 'Meditation', category: 'Lifestyle' },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.message.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.match.deleteMany();
  await prisma.userHobby.deleteMany();
  await prisma.hobby.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  // Create hobbies
  console.log('📝 Creating hobbies...');
  for (const hobby of hobbies) {
    await prisma.hobby.create({
      data: hobby,
    });
  }

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });