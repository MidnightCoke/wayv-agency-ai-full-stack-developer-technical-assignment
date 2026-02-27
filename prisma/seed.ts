/**
 * Seed script – idempotent upsert of Campaign + Creator records.
 * Reads from data/ (the real assignment data).
 * Run with: bunx prisma db seed
 */
import { PrismaClient } from '@prisma/client';
import campaigns from '../data/campaigns.json';
import creators from '../data/creators.json';

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${campaigns.length} campaigns...`);
  for (const c of campaigns) {
    await prisma.campaign.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        brand: c.brand,
        objective: c.objective,
        targetCountry: c.targetCountry,
        targetGender: c.targetGender,
        targetAgeRange: c.targetAgeRange,
        niches: c.niches,
        preferredHookTypes: c.preferredHookTypes,
        minAvgWatchTime: c.minAvgWatchTime,
        budgetRange: c.budgetRange,
        tone: c.tone,
        doNotUseWords: c.doNotUseWords,
      },
      update: {
        brand: c.brand,
        objective: c.objective,
        targetCountry: c.targetCountry,
        targetGender: c.targetGender,
        targetAgeRange: c.targetAgeRange,
        niches: c.niches,
        preferredHookTypes: c.preferredHookTypes,
        minAvgWatchTime: c.minAvgWatchTime,
        budgetRange: c.budgetRange,
        tone: c.tone,
        doNotUseWords: c.doNotUseWords,
      },
    });
  }
  console.log(`✓ ${campaigns.length} campaigns upserted`);

  console.log(`Seeding ${creators.length} creators...`);
  for (const c of creators) {
    await prisma.creator.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        username: c.username,
        country: c.country,
        niches: c.niches,
        followers: c.followers,
        engagementRate: c.engagementRate,
        avgWatchTime: c.avgWatchTime,
        contentStyle: c.contentStyle,
        primaryHookType: c.primaryHookType,
        brandSafetyFlags: c.brandSafetyFlags,
        audience: c.audience,
        lastPosts: c.lastPosts,
      },
      update: {
        username: c.username,
        country: c.country,
        niches: c.niches,
        followers: c.followers,
        engagementRate: c.engagementRate,
        avgWatchTime: c.avgWatchTime,
        contentStyle: c.contentStyle,
        primaryHookType: c.primaryHookType,
        brandSafetyFlags: c.brandSafetyFlags,
        audience: c.audience,
        lastPosts: c.lastPosts,
      },
    });
  }
  console.log(`✓ ${creators.length} creators upserted`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
