import { prisma } from '../lib/prisma';

const hobbies = [
  // Sports & Fitness
  { name: 'Football', category: 'Sports' },
  { name: 'Basketball', category: 'Sports' },
  { name: 'Tennis', category: 'Sports' },
  { name: 'Soccer', category: 'Sports' },
  { name: 'Swimming', category: 'Sports' },
  { name: 'Running', category: 'Sports' },
  { name: 'Cycling', category: 'Sports' },
  { name: 'Gym', category: 'Sports' },
  { name: 'Yoga', category: 'Sports' },
  { name: 'Pilates', category: 'Sports' },
  { name: 'Boxing', category: 'Sports' },
  { name: 'Martial Arts', category: 'Sports' },
  { name: 'Rock Climbing', category: 'Sports' },
  { name: 'Hiking', category: 'Sports' },
  { name: 'Skiing', category: 'Sports' },
  { name: 'Snowboarding', category: 'Sports' },
  { name: 'Surfing', category: 'Sports' },
  { name: 'Volleyball', category: 'Sports' },
  { name: 'Baseball', category: 'Sports' },
  { name: 'Golf', category: 'Sports' },

  // Arts & Culture
  { name: 'Painting', category: 'Arts' },
  { name: 'Drawing', category: 'Arts' },
  { name: 'Photography', category: 'Arts' },
  { name: 'Music', category: 'Arts' },
  { name: 'Singing', category: 'Arts' },
  { name: 'Dancing', category: 'Arts' },
  { name: 'Theater', category: 'Arts' },
  { name: 'Acting', category: 'Arts' },
  { name: 'Writing', category: 'Arts' },
  { name: 'Poetry', category: 'Arts' },
  { name: 'Sculpting', category: 'Arts' },
  { name: 'Pottery', category: 'Arts' },
  { name: 'Crafts', category: 'Arts' },
  { name: 'Knitting', category: 'Arts' },
  { name: 'Sewing', category: 'Arts' },
  { name: 'Woodworking', category: 'Arts' },
  { name: 'Calligraphy', category: 'Arts' },
  { name: 'Film', category: 'Arts' },
  { name: 'Cinema', category: 'Arts' },
  { name: 'Museums', category: 'Arts' },

  // Technology & Gaming
  { name: 'Programming', category: 'Technology' },
  { name: 'Gaming', category: 'Technology' },
  { name: 'Video Games', category: 'Technology' },
  { name: 'Board Games', category: 'Technology' },
  { name: 'Chess', category: 'Technology' },
  { name: 'Puzzles', category: 'Technology' },
  { name: 'VR', category: 'Technology' },
  { name: 'AI', category: 'Technology' },
  { name: 'Robotics', category: 'Technology' },
  { name: 'Cryptocurrency', category: 'Technology' },
  { name: 'Blockchain', category: 'Technology' },
  { name: 'Web Development', category: 'Technology' },
  { name: 'Mobile Apps', category: 'Technology' },
  { name: 'Data Science', category: 'Technology' },
  { name: 'Cybersecurity', category: 'Technology' },

  // Food & Cooking
  { name: 'Cooking', category: 'Food' },
  { name: 'Baking', category: 'Food' },
  { name: 'Wine Tasting', category: 'Food' },
  { name: 'Coffee', category: 'Food' },
  { name: 'Tea', category: 'Food' },
  { name: 'Cocktails', category: 'Food' },
  { name: 'BBQ', category: 'Food' },
  { name: 'Vegan Cooking', category: 'Food' },
  { name: 'International Cuisine', category: 'Food' },
  { name: 'Food Photography', category: 'Food' },
  { name: 'Restaurant Reviews', category: 'Food' },
  { name: 'Food Blogging', category: 'Food' },

  // Travel & Adventure
  { name: 'Travel', category: 'Travel' },
  { name: 'Backpacking', category: 'Travel' },
  { name: 'Road Trips', category: 'Travel' },
  { name: 'Camping', category: 'Travel' },
  { name: 'Adventure Sports', category: 'Travel' },
  { name: 'Cultural Exchange', category: 'Travel' },
  { name: 'Language Learning', category: 'Travel' },
  { name: 'Photography', category: 'Travel' },
  { name: 'Travel Blogging', category: 'Travel' },
  { name: 'Solo Travel', category: 'Travel' },
  { name: 'Group Travel', category: 'Travel' },
  { name: 'Luxury Travel', category: 'Travel' },

  // Entertainment & Media
  { name: 'Movies', category: 'Entertainment' },
  { name: 'TV Shows', category: 'Entertainment' },
  { name: 'Netflix', category: 'Entertainment' },
  { name: 'Podcasts', category: 'Entertainment' },
  { name: 'Comedy', category: 'Entertainment' },
  { name: 'Stand-up Comedy', category: 'Entertainment' },
  { name: 'Concerts', category: 'Entertainment' },
  { name: 'Festivals', category: 'Entertainment' },
  { name: 'Live Music', category: 'Entertainment' },
  { name: 'Theater Shows', category: 'Entertainment' },
  { name: 'Opera', category: 'Entertainment' },
  { name: 'Ballet', category: 'Entertainment' },

  // Health & Wellness
  { name: 'Meditation', category: 'Wellness' },
  { name: 'Mindfulness', category: 'Wellness' },
  { name: 'Mental Health', category: 'Wellness' },
  { name: 'Nutrition', category: 'Wellness' },
  { name: 'Fitness', category: 'Wellness' },
  { name: 'Wellness', category: 'Wellness' },
  { name: 'Spa', category: 'Wellness' },
  { name: 'Massage', category: 'Wellness' },
  { name: 'Aromatherapy', category: 'Wellness' },
  { name: 'Alternative Medicine', category: 'Wellness' },
  { name: 'Holistic Health', category: 'Wellness' },
  { name: 'Self-Care', category: 'Wellness' },

  // Education & Learning
  { name: 'Reading', category: 'Education' },
  { name: 'Books', category: 'Education' },
  { name: 'Learning', category: 'Education' },
  { name: 'Online Courses', category: 'Education' },
  { name: 'Languages', category: 'Education' },
  { name: 'History', category: 'Education' },
  { name: 'Science', category: 'Education' },
  { name: 'Philosophy', category: 'Education' },
  { name: 'Psychology', category: 'Education' },
  { name: 'Economics', category: 'Education' },
  { name: 'Politics', category: 'Education' },
  { name: 'Current Events', category: 'Education' },

  // Social & Community
  { name: 'Volunteering', category: 'Social' },
  { name: 'Community Service', category: 'Social' },
  { name: 'Charity Work', category: 'Social' },
  { name: 'Social Causes', category: 'Social' },
  { name: 'Environmental Activism', category: 'Social' },
  { name: 'Human Rights', category: 'Social' },
  { name: 'Networking', category: 'Social' },
  { name: 'Public Speaking', category: 'Social' },
  { name: 'Leadership', category: 'Social' },
  { name: 'Mentoring', category: 'Social' },
  { name: 'Team Building', category: 'Social' },
  { name: 'Event Planning', category: 'Social' },

  // Outdoor & Nature
  { name: 'Gardening', category: 'Nature' },
  { name: 'Nature Photography', category: 'Nature' },
  { name: 'Bird Watching', category: 'Nature' },
  { name: 'Fishing', category: 'Nature' },
  { name: 'Hunting', category: 'Nature' },
  { name: 'Wildlife', category: 'Nature' },
  { name: 'Conservation', category: 'Nature' },
  { name: 'Ecology', category: 'Nature' },
  { name: 'Astronomy', category: 'Nature' },
  { name: 'Stargazing', category: 'Nature' },
  { name: 'Meteorology', category: 'Nature' },
  { name: 'Geology', category: 'Nature' },

  // Business & Finance
  { name: 'Entrepreneurship', category: 'Business' },
  { name: 'Startups', category: 'Business' },
  { name: 'Investing', category: 'Business' },
  { name: 'Stock Market', category: 'Business' },
  { name: 'Real Estate', category: 'Business' },
  { name: 'Trading', category: 'Business' },
  { name: 'Finance', category: 'Business' },
  { name: 'Marketing', category: 'Business' },
  { name: 'Sales', category: 'Business' },
  { name: 'Management', category: 'Business' },
  { name: 'Consulting', category: 'Business' },
  { name: 'Networking', category: 'Business' },

  // Fashion & Beauty
  { name: 'Fashion', category: 'Fashion' },
  { name: 'Style', category: 'Fashion' },
  { name: 'Makeup', category: 'Fashion' },
  { name: 'Skincare', category: 'Fashion' },
  { name: 'Hair Styling', category: 'Fashion' },
  { name: 'Nail Art', category: 'Fashion' },
  { name: 'Jewelry', category: 'Fashion' },
  { name: 'Accessories', category: 'Fashion' },
  { name: 'Design', category: 'Fashion' },
  { name: 'Modeling', category: 'Fashion' },
  { name: 'Fashion Photography', category: 'Fashion' },
  { name: 'Fashion Blogging', category: 'Fashion' },

  // Pets & Animals
  { name: 'Dogs', category: 'Pets' },
  { name: 'Cats', category: 'Pets' },
  { name: 'Pets', category: 'Pets' },
  { name: 'Animal Care', category: 'Pets' },
  { name: 'Veterinary', category: 'Pets' },
  { name: 'Animal Rescue', category: 'Pets' },
  { name: 'Wildlife Conservation', category: 'Pets' },
  { name: 'Pet Training', category: 'Pets' },
  { name: 'Pet Grooming', category: 'Pets' },
  { name: 'Animal Photography', category: 'Pets' },
  { name: 'Pet Therapy', category: 'Pets' },
  { name: 'Animal Rights', category: 'Pets' }
];

async function addHobbies() {
  try {
    console.log('Adding hobbies to database...');
    
    for (const hobby of hobbies) {
      await prisma.hobby.upsert({
        where: { name: hobby.name },
        update: {},
        create: {
          name: hobby.name,
          category: hobby.category
        }
      });
    }
    
    console.log(`Successfully added ${hobbies.length} hobbies to the database!`);
  } catch (error) {
    console.error('Error adding hobbies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addHobbies();
